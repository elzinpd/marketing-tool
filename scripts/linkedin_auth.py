import webbrowser
import http.server
import socketserver
import urllib.parse
import os
import sys
import json
import requests
import logging

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now we can import from app
from app.services.linkedin_service import LinkedInService
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OAuth callback handler
class OAuthCallbackHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle OAuth callback"""
        query_components = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

        # Get authorization code
        if 'code' in query_components:
            code = query_components['code'][0]
            logger.info("Received authorization code")

            # Exchange code for token
            try:
                linkedin_service = LinkedInService()
                token_data = linkedin_service.exchange_code_for_token(
                    code=code,
                    redirect_uri="http://localhost:8000/callback"
                )

                # Save token to file
                access_token = token_data.get('access_token', '')
                refresh_token = token_data.get('refresh_token', '')
                expires_in = token_data.get('expires_in', 0)

                # Create tokens directory if it doesn't exist
                tokens_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tokens')
                os.makedirs(tokens_dir, exist_ok=True)

                # Save token data to file
                token_file_path = os.path.join(tokens_dir, 'linkedin_token.json')
                with open(token_file_path, 'w') as f:
                    json.dump(token_data, f, indent=2)

                logger.info(f"Token saved to {token_file_path}")

                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()

                response = f"""
                <html>
                <head>
                    <title>LinkedIn Authorization Successful</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                        .container {{ max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                        .success {{ color: green; }}
                        .token-box {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; }}
                        .instructions {{ background-color: #fffde7; padding: 15px; border-radius: 5px; margin-top: 20px; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1 class="success">Authorization Successful!</h1>
                        <p>Your LinkedIn access token has been saved to: <code>{token_file_path}</code></p>

                        <h3>Access Token:</h3>
                        <div class="token-box">{access_token}</div>

                        <h3>Token Details:</h3>
                        <ul>
                            <li><strong>Expires in:</strong> {expires_in} seconds (approximately {expires_in // 3600} hours)</li>
                            <li><strong>Refresh Token Available:</strong> {'Yes' if refresh_token else 'No'}</li>
                        </ul>

                        <div class="instructions">
                            <h3>Next Steps:</h3>
                            <ol>
                                <li>Add this token to your environment variables:</li>
                                <pre>LINKEDIN_ACCESS_TOKEN={access_token}</pre>
                                <li>Update your .env file with this token</li>
                                <li>Restart your application to use the new token</li>
                            </ol>
                        </div>
                    </div>
                </body>
                </html>
                """
                self.wfile.write(response.encode())
            except Exception as e:
                logger.error(f"Error exchanging code for token: {str(e)}")
                self.send_error(500, "Failed to exchange code for token")
        else:
            self.send_error(400, "Authorization code not found in callback")

def main():
    """Start OAuth flow"""
    try:
        # Initialize LinkedIn service
        linkedin_service = LinkedInService()

        # Check if client ID and secret are configured
        if not linkedin_service.client_id or not linkedin_service.client_secret:
            logger.error("LinkedIn client ID or client secret not configured.")
            logger.error("Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.")
            return

        logger.info("\n==== LinkedIn OAuth Authentication ====")
        logger.info("This script will help you get an access token for the LinkedIn API.")
        logger.info("A browser window will open for you to log in to LinkedIn and authorize the application.")
        logger.info("After authorization, the token will be saved to a file.\n")

        # Generate authorization URL
        redirect_uri = "http://localhost:8000/callback"
        auth_url = linkedin_service.get_auth_url(
            redirect_uri=redirect_uri,
            state="linkedin_auth_state"
        )

        logger.info(f"Using client ID: {linkedin_service.client_id}")
        logger.info(f"Redirect URI: {redirect_uri}")

        # Start callback server
        try:
            with socketserver.TCPServer(("", 8000), OAuthCallbackHandler) as httpd:
                logger.info("\nStarting callback server on port 8000")
                logger.info("Opening browser for authorization...")
                webbrowser.open(auth_url)

                logger.info("Waiting for callback... (Please complete the authorization in your browser)")
                httpd.handle_request()
                logger.info("Server closed.")
        except OSError as e:
            if e.errno == 10048:  # Address already in use
                logger.error("Port 8000 is already in use. Please close any application using this port and try again.")
            else:
                logger.error(f"Server error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()