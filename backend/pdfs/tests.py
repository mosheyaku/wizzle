import io
import pytest
from django.urls import reverse
from rest_framework import status
from .models import UploadedPDF, TranslationCache
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import MagicMock


@pytest.mark.django_db
def test_pdf_upload_success(auth_client):
    pdf_content = b'%PDF-1.4 test pdf content'
    file = SimpleUploadedFile("test.pdf", pdf_content, content_type="application/pdf")

    url = reverse('upload-pdf')
    response = auth_client.post(url, {'file': file}, format='multipart')

    assert response.status_code == status.HTTP_201_CREATED
    assert UploadedPDF.objects.count() == 1

    pdf = UploadedPDF.objects.first()
    print(f"Saved file name: {pdf.file.name}")

    assert pdf.file.name.startswith('pdfs/test')
    assert pdf.file.name.endswith('.pdf')


@pytest.mark.django_db
def test_pdf_upload_no_file(auth_client):
    url = reverse('upload-pdf')
    response = auth_client.post(url, {}) 
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_pdf_text_extract_success(auth_client):
    pdf = UploadedPDF.objects.create(file='pdfs/test.pdf')
    
    with patch('fitz.open') as mock_fitz_open:
        mock_doc = mock_fitz_open.return_value
        page_mock = MagicMock()
        page_mock.get_text.return_value = [(0,0,0,0,'word1'), (1,1,1,1,'word2')]
        
        mock_doc.__iter__.return_value = [page_mock]
        
        url = reverse('extract-text', kwargs={'pk': pdf.id})
        response = auth_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert 'pages' in response.data
    assert response.data['pages'][0][0]['word'] == 'word1'


@pytest.mark.django_db
def test_pdf_text_extract_not_found(auth_client):
    url = reverse('extract-text', kwargs={'pk': 9999})
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_pdf_text_extract_exception(auth_client):
    pdf = UploadedPDF.objects.create(file='pdfs/test.pdf')
    with patch('fitz.open', side_effect=Exception("boom")):
        url = reverse('extract-text', kwargs={'pk': pdf.id})
        response = auth_client.get(url)
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data


@pytest.mark.django_db
def test_translate_word_cached(auth_client):
    TranslationCache.objects.create(word='hello', translated='שלום')
    url = reverse('translate-word')
    response = auth_client.post(url, {'word': 'hello'})
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data['translated'] == 'שלום'


@pytest.mark.django_db
@patch('pdfs.views.requests.post')
def test_translate_word_success(mock_post, auth_client):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = [{
        'translations': [{'text': 'שלום'}]
    }]
    url = reverse('translate-word')
    response = auth_client.post(url, {'word': 'hello!'})
    
    assert response.status_code == status.HTTP_200_OK
    assert response.data['translated'] == 'שלום'
    assert TranslationCache.objects.filter(word='hello').exists()


@pytest.mark.django_db
def test_translate_word_no_word(auth_client):
    url = reverse('translate-word')
    response = auth_client.post(url, {})
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


@pytest.mark.django_db
def test_translate_word_invalid_word(auth_client):
    url = reverse('translate-word')
    response = auth_client.post(url, {'word': '!!!$$$'})
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'error' in response.data


@pytest.mark.django_db
@patch('pdfs.views.requests.post')
def test_translate_word_api_failure(mock_post, auth_client):
    mock_post.side_effect = Exception("API error")
    
    url = reverse('translate-word')
    response = auth_client.post(url, {'word': 'hello'})
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert 'error' in response.data
