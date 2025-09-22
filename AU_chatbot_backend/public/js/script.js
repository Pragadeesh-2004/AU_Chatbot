// This file contains the JavaScript code for the application.

document.addEventListener('DOMContentLoaded', function() {
    const rateLimitButton = document.getElementById('rateLimitButton');
    const resultDiv = document.getElementById('result');

    rateLimitButton.addEventListener('click', function() {
        fetch('/api/rate-limit')
            .then(response => response.json())
            .then(data => {
                resultDiv.innerText = `Rate limit status: ${data.status}`;
            })
            .catch(error => {
                console.error('Error:', error);
                resultDiv.innerText = 'An error occurred while checking rate limit.';
            });
    });
});