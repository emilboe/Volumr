// Storing volume in the "local" storage area.
const storage = chrome.storage.sync;



async function run() {

    const volume = await storage.get('volume');
    const sliderStyle = await storage.get('style');

    console.log(volume);
    console.log(sliderStyle);


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
        const seventhGrandparentsFirstChild = seventhGrandparentElement.querySelector(':first-child')

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
            newDiv.className = 'visible';
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

            slider.style.transform = 'rotate(-90deg) translateX(-0.3px)';
            slider.style.writingMode = 'bt-lr';
            slider.style.width = `calc(${elementHeight} - 0.3px)`;
            slider.style.height = `calc(${elementWidth} /10)%`;



            slider.style.outline = 'none'; // Remove outline
            slider.style.appearance = 'none'; // Remove outline
            slider.style.padding = '0'; // Remove outline
            slider.style.border = 'none'; // Remove outline
            slider.style.margin = '0'; // Remove outline

            const style = document.createElement('style');
            style.textContent = `
                .visible{
                    width:10px;
                    border-right: 2px solid white;
                }
                input.slider::-webkit-slider-runnable-track {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    cursor: pointer;
                }
                input.slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                }
                input.slider.Block::-webkit-slider-runnable-track {
                    height: 10px;
                    background: rgb(124, 92, 255);
                }
                input.slider.Block:active::-webkit-slider-runnable-track {
                    background: rgb(124, 115, 255);
                }
                input.slider.Block::-webkit-slider-thumb {
                    height: 100%;
                    width: 15%;
                    background: rgb(88, 10, 179);
                    border-radius: 0;
                }
                input.slider.Circle::-webkit-slider-runnable-track {
                    height: 2px;
                    background: #333;
                }
                input.slider.Circle:active::-webkit-slider-runnable-track {
                    background: #222;
                }
                input.slider.Circle::-webkit-slider-thumb {
                    height: 8px;
                    width: 8px;
                    background: white;
                    margin-top: -3.5px;
                    border-radius: 50%;
                }
                input.slider.None{
                    display:none;
                }
            `;
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
        if(style === 'Block' || style === 'Circle'){
            slider.parentElement.className = 'visible'
        }
        else{
            
            slider.parentElement.className = ''
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



run();