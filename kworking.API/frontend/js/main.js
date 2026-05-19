document.addEventListener('DOMContentLoaded', async () => {
    await loadPopularWorkplaces();
});

async function loadPopularWorkplaces() {
    const container = document.getElementById('popular-cards');
    if (!container) return;

    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Загрузка...</p>';

    try {
        const places = await api.getWorkPlaces();

        container.innerHTML = '';

        if (!places || places.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Пока нет доступных мест</p>';
            return;
        }

        places.slice(0, 6).forEach(place => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${place.imageUrl || 'https://via.placeholder.com/400x220/424123/E6DED3?text=' + encodeURIComponent(place.name)}" alt="${place.name}">
                <div class="card-content">
                    <h3>${place.name}</h3>
                    <p>${place.description || 'Комфортное рабочее место'}</p>
                    <div style="margin: 1rem 0; color: var(--accent); font-size: 1.3rem;">
                        ${place.pricePerHour || place.tariff?.price || 0} ₽/час
                    </div>
                    <button class="btn btn-primary" style="width: 100%;" 
                            onclick="goToWorkplace(${place.id})">
                        Забронировать
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Ошибка загрузки данных</p>';
    }
}

function goToWorkplace(id) {
    window.location.href = `workplace.html?id=${id}`;
}