import pytest
from django.urls import reverse
from learnwords.models import SavedWord
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
def test_save_word_create(auth_client):
    url = reverse('save_word')
    data = {'word': 'hello', 'translation': 'שלום'}

    response = auth_client.post(url, data)
    assert response.status_code == 201
    assert response.data['word'] == 'hello'
    assert SavedWord.objects.filter(word='hello').exists()

    response2 = auth_client.post(url, data)
    assert response2.status_code == 200
    assert 'already saved' in response2.data['message'].lower()


@pytest.mark.django_db
def test_save_word_create_requires_word(auth_client):
    url = reverse('save_word')
    data = {'translation': 'שלום'}

    response = auth_client.post(url, data)
    assert response.status_code == 400
    assert 'word is required' in response.data['error'].lower()


@pytest.mark.django_db
def test_saved_word_list(auth_client, user):
    now = timezone.now()
    past = now - timedelta(days=1)
    future = now + timedelta(days=1)

    SavedWord.objects.create(user=user, word='oldword', next_review_at=past)
    SavedWord.objects.create(user=user, word='futureword', next_review_at=future)
    SavedWord.objects.create(user=user, word='nullword', next_review_at=None)

    url = reverse('list-saved-words')
    response = auth_client.get(url)
    assert response.status_code == 200
    returned_words = {item['word'] for item in response.data}
    assert 'oldword' in returned_words
    assert 'nullword' in returned_words
    assert 'futureword' not in returned_words


@pytest.mark.django_db
def test_review_status_update(auth_client, user):
    word = SavedWord.objects.create(user=user, word='testword')

    url = reverse('saved-words-review')
    data = {'word_id': word.id, 'remembered': True}

    response = auth_client.post(url, data)
    assert response.status_code == 200
    word.refresh_from_db()
    assert word.remembered_count == 1
    assert response.data['id'] == word.id


@pytest.mark.django_db
def test_review_status_update_invalid_word(auth_client):
    url = reverse('saved-words-review')
    data = {'word_id': 9999, 'remembered': True}  

    response = auth_client.post(url, data)
    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_saved_word(auth_client, user):
    word = SavedWord.objects.create(user=user, word='todelete')

    url = reverse('delete_saved_word', kwargs={'pk': word.id})
    response = auth_client.delete(url)
    assert response.status_code == 204
    assert not SavedWord.objects.filter(id=word.id).exists()



@pytest.mark.django_db
def test_reset_learning(auth_client, user):
    word = SavedWord.objects.create(
        user=user,
        word='resetword',
        remembered_count=3,
        last_reviewed_at=timezone.now() - timedelta(days=5),
        next_review_at=timezone.now() + timedelta(days=10)
    )
    url = reverse('reset_learning')
    data = {'word_id': word.id}

    response = auth_client.post(url, data)
    assert response.status_code == 200
    word.refresh_from_db()
    assert word.remembered_count == 0

    diff = word.next_review_at - timezone.now()
    assert timedelta(hours=23, minutes=59) <= diff <= timedelta(days=1, minutes=1)
