// Your ORCID iD
const orcidId = '0000-0001-5102-7797';
const myName = 'Philip M. Nelson'

// ORCID API endpoint for fetching publications
const endpoint = `https://pub.orcid.org/v3.0/${orcidId}/works`;

// Pull year/month/day out of an ORCID publication-date, defaulting missing
// parts to 0 so partial dates sort after complete ones in the same year
function dateParts(publicationDate) {
  if (!publicationDate) {
    return [0, 0, 0];
  }
  return ['year', 'month', 'day'].map(part => {
    return publicationDate[part] ? parseInt(publicationDate[part]['value'], 10) : 0;
  });
}

// Fetch publications using ORCID Public API
fetch(endpoint, {
  headers: {
    Accept: 'application/json'
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch publications');
    }
    return response.json();
  })
  .then(data => {
    // Process the list of publications
    const publications = data['group'];

    // Fetch detailed information for every publication before rendering, so
    // the list order does not depend on which request finishes first
    return Promise.all(publications.map(publication => {
      const putCode = publication['work-summary'][0]['put-code'];

      return fetch(`https://pub.orcid.org/v3.0/${orcidId}/work/${putCode}`, {
        headers: {
          Accept: 'application/json'
        }
      })
        .then(response => response.json())
        .catch(error => {
          console.error('Error fetching detailed publication information:', error);
          return null;
        });
    }));
  })
  .then(works => {
    // Newest first
    const sorted = works
      .filter(work => work !== null)
      .sort((a, b) => {
        const dateA = dateParts(a['publication-date']);
        const dateB = dateParts(b['publication-date']);
        return dateB[0] - dateA[0] || dateB[1] - dateA[1] || dateB[2] - dateA[2];
      });

    // Populate the HTML with the list of publications
    const publicationList = document.getElementById('publication-list');
    sorted.forEach(data => {
      const title = data['title']['title']['value'];
      const authors = data['contributors'] ? data['contributors']['contributor']
        .map(contributor => {
          const authorName = contributor['credit-name']['value'];
          return authorName == myName ? `<strong>${authorName}</strong>` : authorName;
        })
        .join(', ') : 'N/A';
      const journal = data['journal-title'] ? data['journal-title']['value'] : 'N/A';
      const year = dateParts(data['publication-date'])[0] || 'N/A';
      const doi = data['external-ids']['external-id']
        .find(externalId => externalId['external-id-type'] === 'doi')['external-id-value'];

      const li = document.createElement('li');
      li.innerHTML = `${authors}. ${title}. ${journal} (${year}). DOI: <a href="https://doi.org/${doi}" target="_blank">${doi}</a><br>`;
      publicationList.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error fetching publications:', error);
  });
