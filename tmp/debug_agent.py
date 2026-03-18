import sys
import os

# Add apps/agent to sys.path
sys.path.append(os.path.join(os.getcwd(), 'apps', 'agent'))

try:
    from app.main import app
    print("Import successful")
except Exception as e:
    import traceback
    traceback.print_exc()
