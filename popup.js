document.addEventListener('DOMContentLoaded', () => {
    const volumeSlider = document.getElementById('volume');
    const volumeLabel = document.getElementById('volumeLabel');
    //const saveButton = document.getElementById('saveButton'); // not sure if save button is required
    const sliderForm = document.getElementById('sliderForm');
    const sliders = document.querySelectorAll('input[type="range"]');
    const styleyo = document.getElementById('styleyo');


    // Function to update slider styles
    // function updateSliderStyle(styleClass) {
    //     sliders.forEach(slider => {
    //         slider.parentNode.className = '';
    //         if (styleClass !== 'noStyle') {
    //             slider.parentNode.classList.add(styleClass);
    //         }
    //     });
    // }


    // Load the saved sliderstyle value from Chrome storage
    chrome.storage.sync.get(['style'], (result) => {
        if (result.style !== undefined) {

            // Select the corresponding radio button
            const radioButton = document.querySelector(`input[name="sliderStyle"][value="${result.style}"]`);
            if (radioButton) {
                radioButton.checked = true;
            }
            styleyo.innerHTML = result.style

            //updateSliderTrackBackground(`linear-gradient(90deg, #00BFFF ${volumeSlider.value}%, gray 0%)`);
        } else { console.log('cant find slider.style') }
    });

    // Add event listener to the form
    sliderForm.addEventListener('change', (event) => {

        const selectedStyle = document.querySelector('input[name="sliderStyle"]:checked').value;
        const style = event.target.value;
        console.log(selectedStyle, style)

        if (event.target.name === 'sliderStyle') {
            //updateSliderStyle(event.target.value);

            // Send message to the content script to update sliderStyle live
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'setSlider', style: style });

                    // Save the volume setting
                    chrome.storage.sync.set({ style: style }, () => {
                        console.log(`SliderStyle is set to ${style}`);
                    });
                }
            });
        }
    });

    // Set initial style based on the default selected radio button
    //const selectedStyle = document.querySelector('input[name="sliderStyle"]:checked').value;
    //updateSliderStyle(selectedStyle);


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

    // saveButton.addEventListener('click', () => {
    //     const volume = volumeSlider.value;

    //     // Save the volume setting
    //     chrome.storage.sync.set({ volume: volume }, () => {
    //         console.log(`Volume is set to ${volume}`);

    //         // Close the popup
    //         window.close();
    //     });
    // });
});


function updateSliderTrackBackground(newBackground) {
    document.documentElement.style.setProperty('--slider-track-background', newBackground);
}