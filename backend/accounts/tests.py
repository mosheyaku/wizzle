import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.mark.django_db
def test_register_success():
    client = APIClient()
    url = reverse('register')
    data = {
        "first_name": "Moshe",
        "last_name": "Yaku",
        "email": "moshe@example.com",
        "username": "moshe123",
        "password": "ComplexPass123!",
        "password2": "ComplexPass123!"
    }
    response = client.post(url, data)
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(email="moshe@example.com").exists()


@pytest.mark.django_db
def test_register_password_mismatch():
    client = APIClient()
    url = reverse('register')
    data = {
        "first_name": "Moshe",
        "last_name": "Yaku",
        "email": "moshe@example.com",
        "username": "moshe123",
        "password": "ComplexPass123!",
        "password2": "WrongPass123!"
    }
    response = client.post(url, data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in response.data


@pytest.mark.django_db
def test_register_weak_password():
    client = APIClient()
    url = reverse('register')
    data = {
        "first_name": "Moshe",
        "last_name": "Yaku",
        "email": "moshe@example.com",
        "username": "moshe123",
        "password": "123",
        "password2": "123"
    }
    response = client.post(url, data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "password" in response.data


@pytest.mark.django_db
def test_login_unauthenticated():
    client = APIClient()
    url = reverse('login')
    response = client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_login_authenticated():
    user = User.objects.create_user(
        email="moshe@example.com",
        username="moshe123",
        password="ComplexPass123!",
        first_name="Moshe",
        last_name="Yaku",
    )
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse('login')
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data['email'] == "moshe@example.com"
    assert response.data['first_name'] == "Moshe"
    assert response.data['last_name'] == "Yaku"