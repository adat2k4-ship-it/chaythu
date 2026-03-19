let chart = null;

async function upload() {
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Vui lòng chọn file!');
    return;
  }

  // KHÔNG KIỂM TRA PING - BỎ QUA HOÀN TOÀN
  console.log("🚀 Bắt đầu upload...");

  document.getElementById('loading').style.display = 'block';
  document.getElementById('uploadBtn').disabled = true;
  document.getElementById('alert').style.display = 'none';

  const formData = new FormData();
  formData.append('image', file);

  try {
    console.log("📡 Đang upload file:", file.name);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    console.log("📥 Status:", res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("📦 Data:", data);
    
    if (data.success) {
  // Hiển thị kết quả phân tích
  document.getElementById('result').innerHTML = `
    <strong>📊 Kết quả phân tích:</strong>
    <pre>${JSON.stringify(data.data, null, 2)}</pre>
    <hr>
    <strong>📝 OCR text (${data.ocrLength || 0} ký tự):</strong>
    <pre style="max-height:200px; overflow:auto;">${data.ocrText || 'Không có'}</pre>
  `;
  await loadChart();
  alert('✅ Xử lý thành công!');
}
    
  } catch (error) {
    console.error("❌ Lỗi:", error);
    
    let errorMessage = error.message;
    if (error.message === 'Failed to fetch') {
      errorMessage = 'Không thể kết nối đến server. Đảm bảo server đang chạy với "npm run dev"';
    }
    
    document.getElementById('result').innerText = '❌ ' + errorMessage;
    alert('❌ ' + errorMessage);
  } finally {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('uploadBtn').disabled = false;
  }
}

async function loadChart() {
  try {
    const res = await fetch('/api/expenses');
    const data = await res.json();

    const monthly = {};
    data.forEach(item => {
      const date = new Date(item.created_at);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${month}/${year}`;
      
      if (!monthly[key]) {
        monthly[key] = 0;
      }
      monthly[key] += item.amount;
    });

    const ctx = document.getElementById('chart').getContext('2d');
    
    if (chart) {
      chart.destroy();
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(monthly),
        datasets: [{
          label: 'Chi phí (VNĐ)',
          data: Object.values(monthly),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString('vi-VN') + 'đ';
              }
            }
          }
        }
      }
    });

    const values = Object.values(monthly);
    if (values.length >= 2) {
      const last = values[values.length - 1];
      const prev = values[values.length - 2];
      
      if (last > prev * 1.2) {
        const alertDiv = document.getElementById('alert');
        alertDiv.style.display = 'block';
        alertDiv.innerHTML = '⚠️ <strong>Cảnh báo!</strong> Chi phí tháng này tăng hơn 20% so với tháng trước!';
      }
    }

  } catch (error) {
    console.error('Lỗi tải biểu đồ:', error);
  }
}

window.onload = loadChart;