// Storing volume in the "local" storage area.
const storage = chrome.storage.sync;


const style = document.createElement('style');
style.textContent = `
    .visible{
        width: 20px;
        border-right: 2px solid #5c44bd;
    }
    input.slider::-webkit-slider-runnable-track {
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
    }
    input.slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
    }
    input.slider.Block::-webkit-slider-runnable-track {
        height: 20px;
        background: rgb(124, 92, 255);
    }
    input.slider.Block:active::-webkit-slider-runnable-track {
        background: rgb(124, 102, 255);
    }
    input.slider.Block::-webkit-slider-thumb {
        height: 100%;
        width: 15%;
        background: #5c44bd;
        border-radius: 0;
    }
        .circle{
        padding-right:5px;
        }
    input.slider.Circle::-webkit-slider-runnable-track {
        height: 1px;
        background: white;
    }
    input.slider.Circle:active::-webkit-slider-runnable-track {
        background: #a791ff;
    }
    input.slider.Circle::-webkit-slider-thumb {
        height: 8px;
        width: 8px;
        background: white;
        margin-top: -3.3px;
        border-radius: 50%;
    }
    input.slider.None{
        display:none;
    }
`;
document.head.appendChild(style);


// Function to get the nth ancestor of an element
function getNthGrandparent(element, n) {
    let ancestor = element;
    for (let i = 0; i < n; i++) {
        if (ancestor.parentElement) {
            ancestor = ancestor.parentElement;
        } else {
            return null; // We've reached the top of the DOM tree.
        }
    }
    return ancestor;
}

//function to append slider to audio element
function AppendSlider(audioElement, sliderStyle) {

    const secondGrandparentElement = getNthGrandparent(audioElement, 2);
    const seventhGrandparentElement = getNthGrandparent(audioElement, 7);
    const seventhGrandparentsFirstChild = seventhGrandparentElement.querySelector(':first-child')
    var childElement = seventhGrandparentElement.querySelector('.volumr');

    if (childElement) {
        childElement.remove();
        console.log("Removed the child element with class 'volumr'.");
    } else {
        console.log("No child element with class 'volumr' found.");
    }


    if (secondGrandparentElement && seventhGrandparentElement) {

        seventhGrandparentElement.style = "display:grid; grid-template-columns: auto 1fr;"
        seventhGrandparentsFirstChild.style = "order: 2;"

        // Create a new div for the volume control
        const newDiv = document.createElement('div');

        // Get the background color from the computed style of the second grandparent
        const computedStyle = window.getComputedStyle(secondGrandparentElement);
        const elementHeight = computedStyle.height;
        const elementWidth = computedStyle.width;
        //newDiv.style.borderLeft = '2px solid rgba(255,255,255, 0.4)';
        newDiv.style.display = 'flex';
        newDiv.style.alignItems = 'center';
        newDiv.style.justifyContent = 'center';
        newDiv.className = 'volumr visible';
        newDiv.style.background = 'rgb(124, 92, 255)'; // Slider track color
        newDiv.style.order = '1';

        // Create the input slider
        const slider = document.createElement('input');
        slider.setAttribute('class', 'slider ' + sliderStyle.style);
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.value = audioElement.volume; // Set to current audio element's volume

        slider.style.transform = 'rotate(-90deg)';
        slider.style.writingMode = 'bt-lr';
        slider.style.width = `calc(${elementHeight} - 1.3px)`;
        slider.style.height = `calc(${elementWidth} /10)%`;


        slider.style.outline = 'none';
        slider.style.appearance = 'none';
        slider.style.padding = '0';
        slider.style.border = 'none';
        slider.style.margin = '0';



        // Update volume of the audio element when slider changes
        slider.addEventListener('input', (event) => {
            audioElement.volume = event.target.value;
        });

        newDiv.appendChild(slider);
        seventhGrandparentElement.appendChild(newDiv);
    } else {
        if (!secondGrandparentElement) {
            console.error('The 2nd grandparent element was not found for an audio element.');
        }
        if (!seventhGrandparentElement) {
            console.error('The 7th grandparent element was not found for an audio element.');
        }
    }
}

async function run() {

    const volume = await storage.get('volume');
    const sliderStyle = await storage.get('style');
    var audioElements = document.querySelectorAll('audio');

    //console.log(volume);
    //console.log(sliderStyle);





    audioElements.forEach(audioElement => {
        AppendSlider(audioElement, sliderStyle)
    });
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
    //console.log('msg recieved', request)
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


window.addEventListener('load', function () {
    console.log("Page is fully loaded");
    run();
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
                            console.log("New <audio> element added:", node);
                            // Your custom function logic here
                            //myFunction(node);

                        } else if (node.querySelector('audio')) {
                            // Check if the added node contains an <audio> element
                            //console.log("New element containing <audio> added:", node);
                            myFunction(node.querySelector('audio'));
                        }
                    }
                });
            }
        }
    }
}

// Function that you want to run when a new element is created
function myFunction(newElement) {
    console.log("Running function for new element:", newElement);

    const sliderStyle = storage.get('style');
    AppendSlider(newElement, sliderStyle)
    // Add your custom logic here
}

// Select the target node (in this example, we're observing the entire body)
var targetNode = document.body;

// Create a new instance of MutationObserver
var observer = new MutationObserver(handleNewElement);

// Configuration of the observer:
var config = { childList: true, subtree: true };

// Start observing the target node for configured mutations
observer.observe(targetNode, config);
