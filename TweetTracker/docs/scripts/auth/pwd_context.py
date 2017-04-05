__author__ = 'Grant Marshall'

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["sha512_crypt"],
    default="sha512_crypt",
    all__vary_rounds = 0.1
)