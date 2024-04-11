// Your ORCID iD
const orcidId = '0000-0001-5102-7797';
const myName = 'Philip M. Nelson'

// ORCID API endpoint for fetching publications
const endpoint = `https://pub.orcid.org/v3.0/${orcidId}/works`;

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
    console.log(data);
    const publications = data['group'];

    // Populate the HTML with the list of publications
    const publicationList = document.getElementById('publication-list');
    publications.forEach(publication => {
        const putCode = publication['work-summary'][0]['put-code'];

        // Fetch more detailed information for the publication using the put code
      fetch(`https://pub.orcid.org/v3.0/${orcidId}/work/${putCode}`, {
        headers: {
          Accept: 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const title = data['title']['title']['value'];
            const authors = data['contributors'] ? data['contributors']['contributor']
            .map(contributor => {
                const authorName = contributor['credit-name']['value'];
                return authorName == myName ? `<strong>${authorName}</strong>` : authorName;
            })
            .join(', ') : 'N/A';
            const journal = data['journal-title'] ? data['journal-title']['value'] : 'N/A';
            const year = data['publication-date']['year']['value'];
            const doi = data['external-ids']['external-id']
            .find(externalId => externalId['external-id-type'] === 'doi')['external-id-value'];

            const li = document.createElement('li');
            li.innerHTML = `${authors}. ${title}. ${journal} (${year}). DOI: <a href="https://doi.org/${doi}" target="_blank">${doi}</a><br>`;
            publicationList.appendChild(li);
        })
        .catch(error => {
          console.error('Error fetching detailed publication information:', error);
        });
    });
  })
  .catch(error => {
    console.error('Error fetching publications:', error);
  });