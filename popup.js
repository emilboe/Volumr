document.addEventListener('DOMContentLoaded', () => {
    const volumeSlider = document.getElementById('volume');
    const volumeLabel = document.getElementById('volumeLabel');
    const saveButton = document.getElementById('saveButton');

    // Load the saved volume value from Chrome storage
    chrome.storage.sync.get(['volume'], (result) => {
        if (result.volume !== undefined) {
            volumeSlider.value = result.volume;
            volumeLabel.textContent = result.volume;
            updateSliderTrackBackground(`linear-gradient(90deg, #00BFFF ${volumeSlider.value}%, gray 0%)`);
        }
    });

    volumeSlider.addEventListener('input', () => {
        const volume = volumeSlider.value;
        volumeLabel.textContent = volume;

        // Update the slider background color live
        updateSliderTrackBackground(`linear-gradient(90deg, #00BFFF ${volume}%, gray 0%)`);

        // Send message to the content script to update volume live
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'setVolume', volume: volume });

                // Save the volume setting
                chrome.storage.sync.set({ volume: volume }, () => {
                    console.log(`Volume is set to ${volume}`);
                });
            }
        });
    });

    saveButton.addEventListener('click', () => {
        const volume = volumeSlider.value;

        // Save the volume setting
        chrome.storage.sync.set({ volume: volume }, () => {
            console.log(`Volume is set to ${volume}`);

            // Close the popup
            window.close();
        });
    });
});


function updateSliderTrackBackground(newBackground) {
    document.documentElement.style.setProperty('--slider-track-background', newBackground);
}