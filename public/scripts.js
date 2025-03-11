const startButton = document.getElementById('startButton');
const video = document.getElementById('video');
const calorieInfo = document.getElementById('calorieInfo');
const loader = document.getElementById('loader');

let codeReader = new ZXing.BrowserMultiFormatReader();

const hints = new Map();
hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
  ZXing.BarcodeFormat.QR_CODE,
  ZXing.BarcodeFormat.EAN_13,
  ZXing.BarcodeFormat.CODE_128,
  ZXing.BarcodeFormat.UPC_A,
  ZXing.BarcodeFormat.UPC_E,
]);

function startCamera() {
  codeReader
    .listVideoInputDevices()
    .then((videoInputDevices) => {
      const firstDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(firstDeviceId, video, (result, error) => {
        if (result) {
          console.log("Barcode detected: ", result.text);
          fetchCalorieInfo(result.text);

          // Stop scanning after a successful scan
          codeReader.reset();
          startButton.disabled = false; // Re-enable the button
          video.style.display = 'none';
        }
      }, hints);

      video.addEventListener('play', () => {
        console.log('Video stream is playing');
      });
    })
    .catch((err) => {
      console.error('Error accessing camera: ', err);
      calorieInfo.innerHTML = 'Error accessing camera. Please check permissions.';
      calorieInfo.style.display = 'block'; // Show error message
    });
}

function fetchCalorieInfo(barcode) {
  loader.style.display = 'block';
  calorieInfo.style.display = 'none'; // Hide calorie info initially
  calorieInfo.innerHTML = '';

  // Fetch calorie information from your backend
  fetch(`/api/calories?barcode=${barcode}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        calorieInfo.innerHTML = `<strong>Error:</strong> ${data.error}`;
      } else {
        calorieInfo.innerHTML = `
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Calories per serving (${data.servingSize}):</strong> ${data.caloriesPerServing} kcal
        `;
      }
    })
    .catch(error => {
      console.error('Error fetching calorie information:', error);
      calorieInfo.innerHTML = 'Error fetching product information.';
    })
    .finally(() => {
      loader.style.display = 'none';
      calorieInfo.style.display = 'block'; // Show calorie info after fetching
    });
}

startButton.addEventListener('click', function () {
  startCamera();
  startButton.disabled = true;
  video.style.display = 'block';
});

document.getElementById('loginButton').addEventListener('click', () => {
  window.location.href = 'login.html'; // Redirect to the login page
});