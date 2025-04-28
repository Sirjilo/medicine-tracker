// --- BUSCADOR --- 
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const medicine = document.getElementById('medicine').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '🔎 Searching...';

  try {
    const response = await fetch(`/search?name=${medicine}`);
    const data = await response.json();

    if (data.length > 0) {
      const info = data[0];
      resultDiv.innerHTML = `
        <h3>💊 ${info.openfda?.brand_name?.[0] || info.openfda?.generic_name?.[0] || 'Unknown'}</h3>
        <p><strong>Purpose:</strong> ${info.purpose?.[0] || 'N/A'}</p>
        <p><strong>Dosage:</strong> ${info.dosage_and_administration?.[0] || 'N/A'}</p>
        <p><strong>Warnings:</strong> ${info.warnings?.[0] || 'N/A'}</p>
      `;
    } else {
      resultDiv.innerHTML = '❌ No results found. Try another medicine name.';
    }
  } catch (error) {
    resultDiv.innerHTML = '⚠️ An error occurred. Please try again.';
    console.error('Fetch error:', error);
  }
});

// --- RECORDATORIO POR EMAIL --- 
document.getElementById('reminderForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const medicineNameReminder = document.getElementById('medicineNameReminder').value.trim();  // Nombre de la medicina
  const email = document.getElementById('email').value.trim();
  const expiry = document.getElementById('expiry').value;

  try {
    const response = await fetch('/reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicineNameReminder, email, expiry })
    });

    const message = await response.text();
    alert(message);
  } catch (error) {
    console.error('Error sending reminder:', error);
    alert('⚠️ Failed to set reminder.');
  }
});
