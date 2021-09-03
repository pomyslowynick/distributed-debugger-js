const theta = [];

async function fetchAsync (url) {
    const options = {
        method: "GET",
        mode: 'cors'
    };
    let response = fetch(url, options).then(response=>response.json())
    let data = await response;
    return data;
}

const setup = function (n, rx, ry, id) {
    const Svg = d3.select("#graph2")
    const main = document.getElementById(id);
    const mainHeight = parseInt(window.getComputedStyle(main).height.slice(0, -2));
    const circleArray = [];
    const textArray = [];

    for (let i = 0; i < n; i++) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleArray.push(circle);
        circleArray[i].posx = Math.round(rx * (Math.cos(theta[i]))) + 'px';
        circleArray[i].posy = Math.round(ry * (Math.sin(theta[i]))) + 'px';
        circleArray[i].style.backgroundColor = "#264F64";
        circleArray[i].style.top = ((mainHeight / 4) - parseInt(circleArray[i].posy.slice(0, -2))) + 'px';
        circleArray[i].style.left = ((mainHeight / 2) + parseInt(circleArray[i].posx.slice(0, -2))) + 'px';
        let cx =  Math.round(rx * (Math.cos(theta[i]))) + 750;
        let cy = Math.round(ry * (Math.sin(theta[i]))) + 300;
        Svg.append("circle")
            .attr("cx", cx + 'px')
            .attr("cy", cy + 'px')
            .attr("r", 30)
            .style("fill", "#264F64")
            .style("position", "absolute")

        Svg.append("text")
            .attr("x", (cx - 6)  + 'px')
            .attr("y", (cy + 6)  + 'px')
            .text(i + 1)
            .style("position", "absolute")
            .style("fill", "white")
            .style("font-size", "20px")

    }
};


const generate = async function (rx, ry, id) {

    await fetchAsync("http://localhost:8080/get-cluster-state").then(function(response) {
        return response;
    }).then(function (response) {
        let n = response.activeNodes;
        const frags = 360 / n;
        for (let i = 0; i <= n; i++) {
            theta.push((frags / 180) * i * Math.PI);
        }
        setup(n, rx, ry, id);
    })
};