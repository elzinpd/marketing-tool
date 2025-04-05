import webbrowser
import http.server
import socketserver
import urllib.parse
from app.services.linkedin_service import LinkedInService
from app.core.config import settings
import logging

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
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                
                response = f"""
                <html>
                <body>
                    <h1>Authorization Successful!</h1>
                    <p>Your access token is:</p>
                    <textarea rows="5" cols="50" readonly>{token_data.get('access_token', '')}</textarea>
                    <p>Please copy this token and update your .env file.</p>
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
    # Initialize LinkedIn service
    linkedin_service = LinkedInService()
    
    # Generate authorization URL
    auth_url = linkedin_service.get_auth_url(
        redirect_uri="http://localhost:8000/callback",
        state="random_state_string"
    )
    
    # Start callback server
    with socketserver.TCPServer(("", 8000), OAuthCallbackHandler) as httpd:
        logger.info("Starting callback server on port 8000")
        logger.info("Opening browser for authorization...")
        webbrowser.open(auth_url)
        
        logger.info("Waiting for callback...")
        httpd.handle_request()

if __name__ == "__main__":
    main() 