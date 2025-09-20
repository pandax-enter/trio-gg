// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeReviews") {
    scrapeReviews();
  }
  return true;
});

function scrapeReviews() {
  // Extract reviews from Google Maps page
  const reviews = [];
  const reviewElements = document.querySelectorAll('[jsaction][data-review-id]');
  
  reviewElements.forEach((el, index) => {
    const reviewText = el.querySelector('.wiI7pd')?.textContent || '';
    const rating = el.querySelector('.kvMYJc')?.getAttribute('aria-label') || '';
    const author = el.querySelector('.d4r55')?.textContent || '';
    
    if (reviewText) {
      reviews.push({
        id: index,
        text: reviewText,
        rating: rating.match(/\d/)?.[0] || '0',
        author: author
      });
    }
  });
  
  // Send reviews to backend for analysis
  fetch('https://3sbntizpbb.execute-api.ap-southeast-1.amazonaws.com/prod', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reviews })
  })
  .then(response => response.json())
  .then(data => {
    displayResults(data.results);
    displayOverallScore(data.overallScore);
  })
  .catch(error => console.error('Error:', error));
}

function displayResults(results) {
  // Display analysis next to each review
  results.forEach(result => {
    const reviewElement = document.querySelector(`[data-review-id]:nth-child(${result.id + 1})`);
    if (reviewElement) {
      const badge = document.createElement('div');
      badge.className = 'authenticity-badge';
      badge.innerHTML = `
        <span style="color: ${result.score > 0.7 ? 'green' : result.score > 0.4 ? 'orange' : 'red'}">
          ${(result.score * 100).toFixed(0)}% Authentic
        </span>
      `;
      badge.style.marginTop = '5px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = 'bold';
      reviewElement.appendChild(badge);
    }
  });
}

function displayOverallScore(score) {
  // Create overall score display at top of page
  let scoreDiv = document.getElementById('overall-authenticity-score');
  if (!scoreDiv) {
    scoreDiv = document.createElement('div');
    scoreDiv.id = 'overall-authenticity-score';
    scoreDiv.style.position = 'fixed';
    scoreDiv.style.top = '10px';
    scoreDiv.style.right = '10px';
    scoreDiv.style.zIndex = '1000';
    scoreDiv.style.padding = '10px';
    scoreDiv.style.backgroundColor = 'white';
    scoreDiv.style.border = '1px solid #ccc';
    scoreDiv.style.borderRadius = '5px';
    scoreDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    document.body.appendChild(scoreDiv);
  }
  
  scoreDiv.innerHTML = `
    <div style="text-align: center;">
      <h3 style="margin: 0 0 5px 0;">Overall Authenticity</h3>
      <div style="font-size: 24px; font-weight: bold; color: ${score > 0.7 ? 'green' : score > 0.4 ? 'orange' : 'red'}">
        ${(score * 100).toFixed(0)}%
      </div>
      <button id="upgrade-btn" style="margin-top: 10px; padding: 5px 10px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Upgrade
      </button>
    </div>
  `;
  
  document.getElementById('upgrade-btn').addEventListener('click', () => {
    window.open('https://your-subscription-site.com', '_blank');
  });
}