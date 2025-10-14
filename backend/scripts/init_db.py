#!/usr/bin/env python3
from database import engine
from models_updated import Base

print('Initializing database schema...')
Base.metadata.create_all(bind=engine)
print('Database initialized.')


