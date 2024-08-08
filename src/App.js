import React, { Component } from 'react';
import Navigation from './components/navigation/Navigation';
import Logo from './components/logo/Logo';
import Rank from './components/rank/Rank';
import ImageLinkForm from './components/imagelinkform/ImageLinkForm';
import FaceRecognition from './components/face_recognition/FaceRecognition';
import SignIn from './components/sign_in/SignIn';
import Register from './components/register/Register';
import ParticlesBg from 'particles-bg';
import './App.css';

const initialState = {
    input: '',
    imageUrl: '',
    box: {},
    route: 'signin',
    isSignedIn: false,
    user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
    }
}

class App extends Component {
  constructor () {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
    }})
  }

// --> Used to test to make sure front end connects to back end. 
  // componentDidMount() {
  //   fetch('http://localhost:3000/')
  //       .then(response => response.json())
  //       .then(console.log); // this is short hand for doing data => console.log(data);
  // }

  calculateFaceLocation = (topRow, leftCol, bottomRow, rightCol) => {
    //getting the image element for Dom Manipulation
    const image = document.getElementById('inputImage');
    //getting the width and height of the DOM image as it is loaded.  
    const width = Number(image.width);
    const height = Number(image.height);
    return {
        leftCol: leftCol * width,
        topRow: topRow * height,
        rightCol: width - (rightCol * width),
        bottomRow: height - (bottomRow * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  //Any time the input changes assign the input value to the state.  
  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  // Serves three functions.  
  // 1.  To set the state of the ImageUrl to send to Clarifai 
  // 2.  To send the URL to clarify and receive the response. 
  // 3.  Call the function for drawing a box around faces.  
  onButtonSubmit = () => {
    // set the state of the imageUrl.  
    this.setState({imageUrl: this.state.input});
    fetch('http://localhost:3000/imageurl', {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            input: this.state.input
        })
    })
    .then(data => data.json())
    .then(data => {
        const regions = data.outputs[0].data.regions;
        regions.forEach(region => {
            // Accessing and rounding the bounding box values
            const boundingBox = region.region_info.bounding_box;
            const topRow = boundingBox.top_row.toFixed(3);
            const leftCol = boundingBox.left_col.toFixed(3);
            const bottomRow = boundingBox.bottom_row.toFixed(3);
            const rightCol = boundingBox.right_col.toFixed(3);

            region.data.concepts.forEach(concept => {
                // Accessing and rounding the concept value
                // const name = concept.name;
                // const value = concept.value.toFixed(4);
                
            });
            // if data exists increase the face detect cout
            if (data) {
                fetch('http://localhost:3000/image', {
                    method: 'put',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        id: this.state.user.id
                    })
                })
                .then(response => response.json())
                .then(count => {
                    this.setState(Object.assign(this.state.user, { entries: count }))
                    })
                .catch(console.log)
            }
            // Call function to calculate the box around faces and send it the values.  
            this.displayFaceBox(this.calculateFaceLocation(topRow, leftCol, bottomRow, rightCol));
        });

    })
    .catch(error => console.log('error', error));
    // Reset the urlInput value after face detection
    const urlInput = document.getElementById('picUrl');
    urlInput.value = '';
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
        this.setState(initialState);
    } else if (route === 'home') {
        this.setState({isSignedIn: true});
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    const userName = this.state.user.name;
    const userEntries = this.state.user.entries;
    return (
      <div className="App">
        <ParticlesBg type="circle" bg={true} />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home' 
        ?  <div>
                <Logo />
                <Rank name = {userName} entries = { userEntries } />
                <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit} />
                <FaceRecognition box={box} imageUrl={imageUrl} />
            </div>
        : (
            route === 'signin' || route === 'signout'
            ? <SignIn loadUser = {this.loadUser} onRouteChange = {this.onRouteChange} />
            : <Register loadUser={this.loadUser} onRouteChange = {this.onRouteChange} />
            )
        }
      </div>
    );
  }

}

export default App;
