// Storing volume in the "local" storage area.
const storage = chrome.storage.sync;

// Function to append slider to audio element
function AppendSlider(audioElement, sliderStyle, defaultVolume = 0.5) {

    let dividedVolume = defaultVolume / 100
    // // set audio elements volume to the cached volume, or default 50%
    audioElement.volume = dividedVolume

    // Declare elements to update
    const secondGrandparent = audioElement.parentElement.parentElement;
    const thirdGrandparent = secondGrandparent.parentElement;
    const firstChild = thirdGrandparent.querySelector(':first-child')
    var volumrElement = thirdGrandparent.querySelector('.volumr');

    // if a volumr element already exist it is removed before being remade
    if (volumrElement) { volumrElement.remove(); }

    if (secondGrandparent && thirdGrandparent) {

        // Style the parent to place the new element on the left and auto fit it
        thirdGrandparent.style = "display:grid; grid-template-columns: auto 1fr;"
        firstChild.style = "order: 2;"

        // Create a new container element for the volume control
        const container = document.createElement('div');

        // Get the computed style of the second grandparent
        const computedStyle = window.getComputedStyle(secondGrandparent);

        container.className = `volumr ${sliderStyle.style !== 'None' ? 'visible' : ''}`;

        // Create the input slider
        const slider = document.createElement('input');
        slider.setAttribute('class', 'slider ' + sliderStyle.style);
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.value = dividedVolume // set slider at a default 50% until cached value is loaded. 
        slider.style.width = `calc(${computedStyle.height} - 1.3px)`;
        slider.style.height = `calc(${computedStyle.width} /10)%`;

        // Update volume of the *individual* audio element when slider changes
        slider.addEventListener('input', (event) => {
            audioElement.volume = event.target.value;
        });

        // Append the slider in container to the correct parent element
        container.appendChild(slider);
        thirdGrandparent.appendChild(container);
    } else {
        if (!secondGrandparent) {
            console.error('The 2nd grandparent element was not found for an audio element.');
        }
        if (!thirdGrandparent) {
            console.error('The 6th grandparent element was not found for an audio element.');
        }
    }
}

async function run() {
    const sliderStyle = await storage.get('style');
    const volume = await storage.get('volume');
    var audioElements = document.querySelectorAll('audio');

    // Append slider to all audio elements
    audioElements.forEach(audioElement => {
        AppendSlider(audioElement, sliderStyle, volume.volume)
    });
    setVolumeForAllAudioElements(volume.volume)
}

function setVolumeForAllAudioElements(volume) {

    //console.log('volume adjusted to', volume)
    const audioElements = document.querySelectorAll('audio');
    const sliderElements = document.querySelectorAll('.slider');

    audioElements.forEach((audio) => {
        audio.volume = volume / 100;
    });
    sliderElements.forEach((slider) => {
        slider.value = volume / 100;
    });
}

function setSliderForAllAudioElements(style) {
    //console.log(style)
    const sliderElements = document.querySelectorAll('.slider');
    sliderElements.forEach((slider) => {
        slider.className = '';
        slider.className = 'slider ' + style;
        if (style === 'Block' || style === 'Circle') {
            slider.parentElement.className = 'volumr visible'
        }
        else {

            slider.parentElement.className = 'volumr'
        }
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.type === 'setVolume') {
        setVolumeForAllAudioElements(request.volume);
        sendResponse({ status: 'success' });
    }
    else if (request.type === 'setSlider') {
        setSliderForAllAudioElements(request.style);
        sendResponse({ status: 'success' });
    }
});

// Load the saved volume value from Chrome storage when the content script is loaded
chrome.storage.sync.get(['volume'], (result) => {
    if (result.volume !== undefined) {
        setVolumeForAllAudioElements(result.volume);
    }
});

// Detecting when page loads new elements, adding volume slider to new audio elements
function handleNewElement(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if new nodes were added
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is an <audio> element
                        if (node.tagName === 'AUDIO') {
                            // this shouldn't happen
                        } else if (node.querySelector('audio')) {
                            // Check if the added node contains an <audio> element
                            updateElement(node.querySelector('audio'));
                        }
                    }
                });
            }
        }
    }
}

// Function that you want to run when a new element is created
async function updateElement(newElement) {

    const volume = await storage.get('volume');
    const sliderStyle = await storage.get('style');
  
    //console.log("Appending slider for new element:", newElement.title);
    AppendSlider(newElement, sliderStyle, volume.volume)
    //setVolumeForAllAudioElements(volume.volume)
}

// Select the target node (in this example, we're observing the entire body)
var targetNode = document.body;

// Create a new instance of MutationObserver
var observer = new MutationObserver(handleNewElement);

// Configuration of the observer:
var config = { childList: true, subtree: true };

// Start observing the target node for configured mutations
observer.observe(targetNode, config);

// when all is declared, start appending the sliders
run();