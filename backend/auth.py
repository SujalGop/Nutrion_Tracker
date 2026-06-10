import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Validates the Clerk JWT token passed in the Authorization header.
    Returns the Clerk user_id (the 'sub' claim).
    """
    token = credentials.credentials
    try:
        # Get issuer from the unverified payload
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified_payload.get("iss")
        if not issuer:
            raise HTTPException(status_code=401, detail="Invalid token: missing issuer")
            
        # Clerk publishes its JWKS at {issuer}/.well-known/jwks.json
        jwks_url = f"{issuer}/.well-known/jwks.json"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify the token securely
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False} # Or set strictly if configured
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject")
            
        return user_id
        
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized")
