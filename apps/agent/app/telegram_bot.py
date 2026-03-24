"""
Telegram bot integration for the Aldawood Court Booking Agent.
Uses webhook mode (not polling) to avoid 409 conflicts during deployments.
Debounces rapid-fire messages so the agent sees one consolidated turn.
"""

import asyncio
import logging
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from app.services.agent_service import agent_service
from app.config import settings

logger = logging.getLogger(__name__)

# Per-chat state
_conversations: dict[int, str] = {}

# Debounce: buffer of pending messages and their timer tasks
DEBOUNCE_SECONDS = 3.0
_pending_messages: dict[int, list[str]] = {}
_debounce_tasks: dict[int, asyncio.Task] = {}
_pending_updates: dict[int, Update] = {}


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    chat_id = update.effective_chat.id
    _conversations.pop(chat_id, None)  # Reset conversation

    await update.message.reply_text(
        "مرحبا! أنا مساعد حجز ملاعب الداوود.\n"
        "Hi! I'm the Aldawood Court Booking assistant.\n\n"
        "Send me a message to book a court, check availability, "
        "or manage your bookings."
    )


async def reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /reset command — start a fresh conversation."""
    chat_id = update.effective_chat.id
    _conversations.pop(chat_id, None)
    await update.message.reply_text("Conversation reset. Send a new message to start fresh!")


async def _flush_messages(chat_id: int):
    """Wait for the debounce window, then process all buffered messages as one."""
    await asyncio.sleep(DEBOUNCE_SECONDS)

    # Grab and clear the buffer
    messages = _pending_messages.pop(chat_id, [])
    update = _pending_updates.pop(chat_id, None)
    _debounce_tasks.pop(chat_id, None)

    if not messages or not update:
        return

    combined = "\n".join(messages)
    phone = f"tg_{chat_id}"
    conversation_id = _conversations.get(chat_id, "")

    await update.effective_chat.send_action("typing")

    try:
        result = await agent_service.run(
            message=combined,
            phone=phone,
            conversation_id=conversation_id,
        )

        conv_id = result.get("conversationId", "")
        if conv_id:
            _conversations[chat_id] = conv_id

        reply = result.get("message", "Sorry, something went wrong. Please try again.")
        await update.message.reply_text(reply)

    except Exception as e:
        logger.error(f"Error processing Telegram message: {e}", exc_info=True)
        await update.message.reply_text(
            "عذرا، حدث خطأ. حاول مرة أخرى.\n"
            "Sorry, an error occurred. Please try again."
        )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Buffer user messages and debounce — only process after a pause."""
    chat_id = update.effective_chat.id
    user_message = update.message.text

    if not user_message:
        return

    # Add message to buffer
    if chat_id not in _pending_messages:
        _pending_messages[chat_id] = []
    _pending_messages[chat_id].append(user_message)
    _pending_updates[chat_id] = update  # Keep latest update for replying

    # Cancel existing timer and start a new one
    existing_task = _debounce_tasks.get(chat_id)
    if existing_task and not existing_task.done():
        existing_task.cancel()

    _debounce_tasks[chat_id] = asyncio.create_task(_flush_messages(chat_id))


def create_telegram_app() -> Application | None:
    """Create and configure the Telegram bot application."""
    token = settings.telegram_bot_token
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN not set — Telegram bot disabled.")
        return None

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("reset", reset_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Telegram bot configured and ready.")
    return app
