"""
Setup script for AI Learning Service
"""

from setuptools import setup, find_packages

setup(
    name="kealee-ai-learning",
    version="1.0.0",
    description="Continuous AI learning system for permit prediction",
    packages=find_packages(),
    install_requires=[
        "torch>=2.0.0",
        "torchvision>=0.15.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scikit-learn>=1.3.0",
        "mlflow>=2.7.0",
        "mlflow-pytorch>=2.7.0",
        "wandb>=0.15.0",
        "python-dateutil>=2.8.2",
        "fastapi>=0.100.0",
        "pydantic>=2.0.0",
        "sqlalchemy>=2.0.0",
        "psycopg2-binary>=2.9.0",
        "pyyaml>=6.0",
    ],
    python_requires=">=3.9",
)
