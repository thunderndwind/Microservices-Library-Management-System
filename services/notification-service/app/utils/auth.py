from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from jose import jwt, JWTError
from datetime import datetime

from app.core.config import settings

security = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and extract user information"""
    try:
        token = credentials.credentials
        
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extract user information
        user_id = payload.get("sub") or payload.get("userId")
        role = payload.get("role", "user")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        
        return {
            "user_id": user_id,
            "role": role,
            "token_payload": payload
        }
        
    except JWTError as e:
        if "expired" in str(e).lower():
            raise HTTPException(status_code=401, detail="Token has expired")
        else:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {str(e)}")


def verify_service_token(x_service_token: Optional[str] = Header(None)) -> dict:
    """Verify service-to-service authentication token"""
    if not x_service_token:
        raise HTTPException(status_code=401, detail="Service token required")
    
    if x_service_token != settings.SERVICE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid service token")
    
    return {"service": "internal", "authenticated": True}


def optional_auth(
    authorization: Optional[str] = Header(None),
    x_service_token: Optional[str] = Header(None)
) -> Optional[dict]:
    """Optional authentication - returns user info if authenticated, None otherwise"""
    try:
        if x_service_token and x_service_token == settings.SERVICE_TOKEN:
            return {"service": "internal", "authenticated": True}
        
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            user_id = payload.get("sub") or payload.get("userId")
            role = payload.get("role", "user")
            
            if user_id:
                return {
                    "user_id": user_id,
                    "role": role,
                    "token_payload": payload
                }
        
        return None
        
    except JWTError:
        return None
    except Exception:
        return None 