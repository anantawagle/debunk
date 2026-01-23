from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.session import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.crud.user import create_user, get_user_by_username, get_user_by_email, authenticate_user
from app.core.security import create_access_token
from app.config import settings

router = APIRouter()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    print(f"Signup attempt: username={user.username}, email={user.email}")

    # Check if username exists
    existing_username = get_user_by_username(db, username=user.username)
    if existing_username:
        print(f"Username already exists: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    existing_email = get_user_by_email(db, email=user.email)
    if existing_email:
        print(f"Email already exists: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    print("Creating user...")
    try:
        new_user = create_user(db=db, user=user)
        print(f"User created successfully: {new_user.username}")
        return new_user
    except Exception as e:
        print(f"Error creating user: {e}")
        raise

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login with username and password (JSON body)"""
    print(f"Login attempt: username={login_data.username}, password_length={len(login_data.password)}")

    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        print(f"Authentication failed for username: {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"Login successful for user: {user.username}")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with OAuth2 password flow (form data)"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

