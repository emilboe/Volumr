// Storing volume in the "sync" storage area for cross-device synchronization
const storage = chrome.storage.sync;

// Function to append slider to audio element
async function appendSlider(audioElement, defaultVolume = 50) {
    const { style: sliderStyle, volume: storedVolume } = await storage.get(['style', 'volume']);
    let volume;
    //if volume of element was previously set, then don't change it
    if (audioElement.volume !== 1) {
        volume = audioElement.volume;
    } else {
        volume = (storedVolume !== undefined ? storedVolume : defaultVolume) / 100;
    }

    audioElement.volume = volume;

    const thirdGrandparent = audioElement.parentElement.parentElement.parentElement;
    if (!thirdGrandparent) {
        console.error('The parent element was not found for an audio element.');
        return;
    }

    const firstChild = thirdGrandparent.querySelector(':first-child');
    let volumrElement = thirdGrandparent.querySelector('.volumr');

    // Remove existing volumr element if it exists
    if (volumrElement) volumrElement.remove();

    //console.log('parentStyle', thirdGrandparent.style, firstChild.style)

    // Style the parent to place the new element on the left and auto fit it
    thirdGrandparent.style = "display:grid; grid-template-columns: auto 1fr;";
    firstChild.style = "order: 2;";

    // Create a new container element for the volume control
    const container = document.createElement('div');
    container.className = `volumr ${sliderStyle !== 'None' ? 'visible' : ''}`;

    // Create the input slider
    const slider = createSlider(audioElement, volume, sliderStyle);

    // Append the slider in container to the correct parent element
    container.appendChild(slider);
    thirdGrandparent.appendChild(container);
}

function createSlider(audioElement, volume, sliderStyle) {
    const slider = document.createElement('input');
    slider.setAttribute('class', `slider ${sliderStyle || 'Circle'}`); // Default to 'Block' if undefined
    slider.type = 'range';
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = volume;

    const parentStyle = window.getComputedStyle(audioElement.parentElement);
    slider.style.width = `calc(${parentStyle.height} - 0.5px)`;
    updateBlockSliderTrackBackground(slider, volume);

    // Update volume of the individual audio element when slider changes
    slider.addEventListener('input', (event) => {
        audioElement.volume = event.target.value;
        updateBlockSliderTrackBackground(slider, event.target.value);
    });

    return slider;
}

function updateBlockSliderTrackBackground(sliderElement, value) {
    const newBackground = `linear-gradient(90deg, rgb(var(--purple-dark)) ${Math.round(value * 100)}%, rgb(var(--purple)) 0%)`;
    sliderElement.style.setProperty('--block-slider-track-background', newBackground);
}

async function run() {
    const { style: sliderStyle, volume } = await storage.get(['style', 'volume']);
    const audioElements = document.querySelectorAll('audio');

    // Append slider to all audio elements
    audioElements.forEach(audioElement => appendSlider(audioElement, volume));
    setVolumeForAllAudioElements(volume);
}

function setVolumeForAllAudioElements(volume) {

    let normalizedVolume;
    if (volume) normalizedVolume = volume / 100;
    else normalizedVolume = 0.5;

    document.querySelectorAll('audio, .slider').forEach(element => {
        if (element.tagName === 'AUDIO') {
            element.volume = normalizedVolume;
        } else {
            element.value = normalizedVolume;
            updateBlockSliderTrackBackground(element, normalizedVolume)
        }
    });
}

function setSliderForAllAudioElements(style) {
    document.querySelectorAll('.slider').forEach(slider => {
        slider.className = `slider ${style}`;
        slider.parentElement.className = `volumr ${style !== 'None' ? 'visible' : ''}`;
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'setVolume') {
        setVolumeForAllAudioElements(request.volume);
    } else if (request.type === 'setSlider') {
        setSliderForAllAudioElements(request.style);

    }
    sendResponse({ status: 'success' });
});

// Load the saved volume value from Chrome storage when the content script is loaded
chrome.storage.sync.get('volume', ({ volume }) => {
    if (volume !== undefined) {
        setVolumeForAllAudioElements(volume);
    }
});

// Detecting when page loads new elements, adding volume slider to new audio elements
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const audioElement = node.tagName === 'AUDIO' ? node : node.querySelector('audio');
                    if (audioElement) updateElement(audioElement);
                }
            });
        }
    });
});

// Function that you want to run when a new element is created
async function updateElement(newElement) {
    const { volume } = await storage.get('volume');
    appendSlider(newElement, volume);
}
// Start observing the entire body for new audio elements
observer.observe(document.body, { childList: true, subtree: true });

// When all is declared, start appending the sliders
run();