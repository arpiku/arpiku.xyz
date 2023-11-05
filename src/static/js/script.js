
// script.js

document.addEventListener("DOMContentLoaded", function () {
    const counter = document.getElementById("counter");
    
    let count = 1;
    
    function updateCounter() {
        counter.textContent = count;
        count++;
        if (count <= 100) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
});
