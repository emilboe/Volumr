// Storing volume in the "local" storage area.
const storage = chrome.storage.local;

async function run() {

    const volume = await storage.get('volume');

    console.log(volume);

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



    var audioElements = document.querySelectorAll('audio');


    audioElements.forEach(audioElement => {
        const secondGrandparentElement = getNthGrandparent(audioElement, 2);
        const seventhGrandparentElement = getNthGrandparent(audioElement, 7);

        if (secondGrandparentElement && seventhGrandparentElement) {

            seventhGrandparentElement.style = "display:grid; grid-template-columns: 1fr 10px;"

            // Create a new div for the volume control
            const newDiv = document.createElement('div');

            // Get the background color from the computed style of the second grandparent
            const computedStyle = window.getComputedStyle(secondGrandparentElement);
            const backgroundColor = computedStyle.backgroundColor || computedStyle.background;
            const elementHeight = computedStyle.height;
            const elementWidth = computedStyle.width;
            //newDiv.style.backgroundColor = backgroundColor; // Set to second grandparent's background color
            newDiv.style.borderLeft = '2px solid rgba(255,255,255, 0.4)';
            //newDiv.style.padding = '5px';
            newDiv.style.display = 'flex';
            newDiv.style.alignItems = 'center';
            newDiv.style.justifyContent = 'center';
            //newDiv.style.gridColumn = '1';
            //newDiv.style.width = '10px'; //`calc(${elementWidth} /10)%`; // container div width
            //newDiv.style.height = '150px';  // Ensure enough height for the vertical slider

            // Create a label for the slider
            //const label = document.createElement('label');
            //label.textContent = 'Volume:';
            //label.style.marginRight = '5px';
            //newDiv.appendChild(label);

            // Create the input slider
            const slider = document.createElement('input');
            slider.setAttribute('class', 'slider');
            slider.type = 'range';
            slider.min = 0;
            slider.max = 1;
            slider.step = 0.01;
            slider.value = audioElement.volume; // Set to current audio element's volume
            // Styling for vertical slider
            slider.style.transform = 'rotate(-90deg) translateX(-0.3px)';
            slider.style.writingMode = 'bt-lr';
            //slider.style.height = '100%';  // Adjust height as needed
            //console.log(elementHeight, "elemenheight");
            slider.style.width = `calc(${elementHeight} - 0.3px)`;
            //console.log(elementWidth, "elemen widdd");
            slider.style.height = `calc(${elementWidth} /10)%`;

            //slider.style.margin = '10px';

            slider.style.background = backgroundColor; // Slider track color
            slider.style.outline = 'none'; // Remove outline
            slider.style.appearance = 'none'; // Remove outline
            slider.style.padding = '0'; // Remove outline
            slider.style.border = 'none'; // Remove outline
            slider.style.margin = '0'; // Remove outline




            const style = document.createElement('style');
            style.textContent = `
          input[type=range]::-webkit-slider-runnable-track {
           -webkit-appearance: none;
            appearance:none;
            width: 100%;
            height: 10px;
            cursor: pointer;
            background: rgb(124, 92, 255);
          }
          input[type=range]:active::-webkit-slider-runnable-track {
            background: rgb(124, 115, 255);
          }
        `;

            const thumbStyle = document.createElement('style');

            thumbStyle.textContent = `
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance:none;
            height: 100%;
            width: 15%;
            background: rgb(88, 10, 179);
            border-radius: 0;
            cursor: pointer;
            z-index:23;
          }
        `;
            document.head.appendChild(thumbStyle);
            document.head.appendChild(style);

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
    });
}
run();

function setVolumeForAllAudioElements(volume) {
    const audioElements = document.querySelectorAll('audio');
    const sliderElements = document.querySelectorAll('.slider');
    audioElements.forEach((audio) => {
        audio.volume = volume / 100;
    });
    sliderElements.forEach((slider) => {
        slider.value = volume / 100;
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'setVolume') {
        setVolumeForAllAudioElements(request.volume);
        sendResponse({ status: 'success' });
    }
});

// Load the saved volume value from Chrome storage when the content script is loaded
chrome.storage.sync.get(['volume'], (result) => {
    if (result.volume !== undefined) {
        setVolumeForAllAudioElements(result.volume);
    }
});
