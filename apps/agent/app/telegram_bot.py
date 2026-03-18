"""
Telegram bot integration for the Aldawood Court Booking Agent.
Uses webhook mode (not polling) to avoid 409 conflicts during deployments.
"""

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

# Store conversation IDs per Telegram chat
_conversations: dict[int, str] = {}


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


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Forward user messages to the agent and reply with the result."""
    chat_id = update.effective_chat.id
    user_message = update.message.text

    if not user_message:
        return

    # Use Telegram chat ID as the phone identifier
    phone = f"tg_{chat_id}"
    conversation_id = _conversations.get(chat_id, "")

    # Show typing indicator
    await update.effective_chat.send_action("typing")

    try:
        result = await agent_service.run(
            message=user_message,
            phone=phone,
            conversation_id=conversation_id,
        )

        # Store conversation ID for future messages
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
