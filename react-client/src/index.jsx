import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import RecipeList from './components/RecipeList.jsx';
import Search from './components/Search.jsx';
import _Test from './_Test.jsx'; /* Feel free to remove me! */
import { searchYummly } from './lib/searchYummly.js';
import { searchSpoonacular } from './lib/searchSpoonacular.js';
import { spoonacularTrivia } from './lib/spoonacularTrivia.js';
import SAMPLE_DATA from './data/SAMPLE_DATA.js';
import DEFAULT_TAGS from './data/DEFAULT_TAGS.js';
import { Jumbotron } from 'react-bootstrap';
import NavBar from './components/NavBar.jsx';
import { Parallax } from 'react-parallax';
import LoginSubmissionForm from './components/LoginSubmissionForm.jsx';
import SignupSubmissionForm from './components/SignupSubmissionForm.jsx';
import Modal from 'react-modal';
import LoadingText from './components/LoadingText.jsx';
import Footer from './components/Footer.jsx';
import { Button } from 'react-bootstrap';
import TiTimes from 'react-icons/lib/ti/times';

const SERVER_URL = "http://127.0.0.1:3000";


const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    overflow              : 'none'
  }
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      query: '',
      data: [],
      searchMode: "Loose",
      username: null,
      userid: null,
      loggedIn: false,
      userFavorites: [],
      view: 'home',
      modalLogin: false,
      modalIsOpen: true,
      modalSignup: false,
      failLogin: '',
      failSignup: '',
      tags: DEFAULT_TAGS,
      loadingText: false,
      randomTrivia: "Did you know..."

    }

    this.setStore = this.setStore.bind(this);
    this.onSearchHandler = this.onSearchHandler.bind(this);
    this.onSearchHandler2 = this.onSearchHandler2.bind(this);
    this.onLoginHandler = this.onLoginHandler.bind(this);
    this.onSignupHandler = this.onSignupHandler.bind(this);
    this.onFavoriteHandler = this.onFavoriteHandler.bind(this);
    this.modalLogin = this.modalLogin.bind(this);
    this.modalSignup = this.modalSignup.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeLogin = this.closeLogin.bind(this);
    this.closeSignup = this.closeSignup.bind(this);
    this.handleTagAdd = this.handleTagAdd.bind(this);
    this.handleTagDelete = this.handleTagDelete.bind(this);
    this.randomTrivia = this.randomTrivia.bind(this);

    this.randomTrivia();

  }

  randomTrivia() {
    spoonacularTrivia((data) => {
      this.setState({randomTrivia: "Did you know... " + data.text});
    });
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeLogin() {
    this.setState({modalLogin: false, failLogin: ''})
  }

  closeSignup() {
    this.setState({modalSignup: false, failSignup: ''})
  }

  setStore(state) {
    this.setState(state)
  }

  onFavoriteHandler(event, data) {
    event.preventDefault();
    var favorites = this.state.userFavorites.slice();
    favorites.push(data);
    console.log('FAVORITE DATA:', data);
    this.setState({
      userFavorites: favorites
    });
  }

  onLoginHandler(event) {
    event.preventDefault();
    var userInput = {
      username: event.target.username.value,
      password: event.target.password.value
    };
    if( userInput.username === '') {
      this.setStore({failLogin:'Username field cannot be empty'})
      return;
    }
    $.post('/login', userInput, (data) => {
      console.log('user data: ', data);
      if(data.length !== 0) {
        if(data[0].password === userInput.password) {
          $.post('/useringredients', {userid:data[0].id}, (data) => {
            console.log('INGREDIENTS: ', data);
            var tags = this.state.tags.slice()
            var id = tags.length+1
            data.forEach( (ingredient) => {
              console.log();
              tags.push({id:tags.length++,text:ingredient.ingredient, ingredient_id:ingredient.id})
              // this.handleTagAdd(ingredient.ingredient)
            })
            this.setStore({tags:tags})
          })
          this.setStore({
            username: userInput.username,
            userid: data[0].id,
            loggedIn: true,
            modalLogin: false
          })
        } else{
          this.setStore({failLogin:'Incorrect password'})
        }
      } else {
        this.setStore({failLogin:'Username does not exist'})
      }
    })
  }

  onSignupHandler(event) {
    event.preventDefault();
    var userInput = {
      username: event.target.username.value,
      password: event.target.password.value
    };
    if( userInput.username === '') {
      this.setStore({failSignup:'Username field cannot be empty'})
      return;
    } else if (userInput.password === '') {
      this.setStore({failSignup:'Password must be at least one character'})
      return;
    }
    var found = false;
    $.get('/users', (data) => {
      data.forEach( (user) => {
        if(user.name === userInput.username) {
          found = true;
        }
      })
      if(!found) {
        $.post('/signup', userInput, (data) => {})
        this.closeSignup();
        this.setStore({failLogin: 'Created, please Login', modalLogin: true})
      } else {
        this.setStore({failSignup: 'Username already exists'})
      }
    })

  }

  onSearchHandler2(e) {
    e.preventDefault();
    var options = {};
    // options.ingredients = this.state.query.split(", ");
    var tags = this.state.tags.slice()
    tags = tags.map( (tag) => {
      return tag.text
    })
    options.ingredients = tags;
    console.log('TAGS: ', tags);
    var queryArray = options.ingredients;
    this.setStore({loadingText: true});
    searchSpoonacular(options, (matches) => {
      console.log("Searching Spoonacular....");
      var data = [];
      if (this.state.searchMode === "Strict") {
        for (var n = 0; n < matches.length; n++) {
          if (matches[n].missedIngredientCount === 0) {
            data.push(matches[n]);
          }
        }
      } else if (this.state.searchMode === "Loose") {
        data = matches;
      }
      console.log('Spoonacular found the following recipes!\n', data);
      this.setStore({data: data, loadingText: false});
    });
  }

  onSearchHandler(e) {
    e.preventDefault();
    console.log('Here is your search query: ', this.state.query);
    var options = {};

    options.ingredients = this.state.query.split(", ");
    var queryArray = options.ingredients;

    searchSpoonacular(options, (matches) => {
      var resultsArray = [];
      for (var i = 0; i < matches.length; i++) {
        var currentMatchIngredientsArray = matches[i].usedIngredients;
        if (currentMatchIngredientsArray.length > queryArray.length) {
          continue;
        }
        var isMatch = true;
        for (var j = 0; j < currentMatchIngredientsArray.length; j++) {
            var currentIngredientMashed = currentMatchIngredientsArray[j].split(' ').join('');
            var isFound = false;
            for (var k = 0; k < queryArray.length; k++) {
              var queryIngredientMashed = queryArray[k].split(' ').join('');
              if (currentIngredientMashed.includes(queryIngredientMashed)) {
                isFound = true;
                break;
              }
            }
            if (!isFound) {
              isMatch = false;
              break;
            }
        }
        if (isMatch) {
          resultsArray.push(matches[i]);
        }
      }
      if (this.state.searchMode === "Strict") {
        this.setState({data: resultsArray});
      } else if (this.state.searchMode === "Loose") {
        this.setState({data: matches});
      }
    });
  }

  favoritesView() {
    return (
      <div className="container">
        <div style={{"padding": "5em"}}/>
        <NavBar setStore={this.setStore} modalSignup={this.modalSignup} modalLogin={this.modalLogin} username={this.state.username} loggedIn={this.state.loggedIn} />
        <RecipeList data={this.state.userFavorites} onFavoriteHandler={this.onFavoriteHandler}/>
      </div>
    );
  }

  modalLogin() {
    this.setState({
      modalSignup: false,
      modalLogin: true
    })
  }

  modalSignup() {
    console.log('modal sign up');
    if(this.state.loggedIn) {
      this.setState({
        loggedIn: false,
        username: null,
        tags: DEFAULT_TAGS
      })
    } else {
      this.setState({
        modalLogin: false,
        modalSignup: true
      })
    }
  }

  handleTagAdd(tag) {
    console.log('tag add: ', tag);
    tag = tag + '  '
    var tags = this.state.tags.slice()
    var tagId = tags.length+1
    tags.push({id:tagId, text:tag})
    var ingredients = {}
    ingredients.userid = this.state.userid;
    ingredients.ingredient = tag;
    if(this.state.userid) {
      $.post('/ingredients', ingredients, (data) => {} );
    }
    console.log('TAGS: ',tags);
    this.setStore({tags:tags})
  }

  handleTagDelete(tag) {
    console.log('TAG to delete: ', tag);
    var tags = this.state.tags.slice()
    var removeIngredient = tags.splice(tag,1)
    console.log('INGREDIENT TO REMOVE: ', removeIngredient);
    var stuff = { userId:this.state.userid, ingredientId:removeIngredient[0].ingredient_id,}
    if(this.state.userid) {
      console.log('USER LOGGED IN TO REMOVE',stuff);
      $.post('/removeIngredient', stuff, (data) => {})
    }
    this.setStore({tags:tags})
  }

  homeView() {
    if (this.state.loggedIn) {
      var username = this.state.username;
      var userDisplay = <div style={{'paddingTop':'25vh'}}/>;
    } else {
      var username = "Not Logged In";
      var userDisplay = (
          <Parallax className="main-card" bgImage="https://i.imgur.com/hpz3tXZ.jpg" strength={400}>
            <div style={{'display':'flex', 'alignItems':'center', 'flexDirection':'column', 'height':'100vh'}}>
              <div style={{'flex':'1'}}/>
              <div style={{'flex': '1'}}><h1 className="subtitle"><div>Why run to the grocery store when you have all the ingredients you need at home? Here at Byte, we help you see the potential of your pantry.</div></h1></div>
              <div style={{'flex':'1'}}/>
            </div>
          </Parallax>
        );
    }

    return (
    <div>
      <NavBar setStore={this.setStore} modalSignup={this.modalSignup} modalLogin={this.modalLogin} username={this.state.username} loggedIn={this.state.loggedIn} />
      {userDisplay}
      <div className="container">
        <Modal
          isOpen={this.state.modalLogin}
          style={customStyles}
          // onAfterOpen={this.afterOpenModal} this is here to show that this onAfterOpen method is available
          // onRequestClose={this.closeModal} this is here to show that this onAfterOpen method is available
          contentLabel="login"
        > <a className="close-button" onClick={this.closeLogin}><TiTimes /></a>
          <LoginSubmissionForm onLoginHandler={this.onLoginHandler}/>
          <div id='login-fail'>{this.state.failLogin}</div>
        </Modal>

        <Modal
          isOpen={this.state.modalSignup}
          contentLabel="signup"
          style={customStyles}
        >
          <a className="close-button" onClick={this.closeSignup}><TiTimes /></a>
          <SignupSubmissionForm onSignupHandler={this.onSignupHandler}/>
          <div id='signup-fail'>{this.state.failSignup}</div>
        </Modal>
        <Search clickHandler={this.onSearchHandler2} handleTagDelete={this.handleTagDelete} handleTagAdd={this.handleTagAdd} tags={this.state.tags} setStore={this.setStore} appState={this.state}/>
        {(this.state.loadingText) ? (<LoadingText />) : null}
        <RecipeList data={this.state.data} onFavoriteHandler={this.onFavoriteHandler}/>
      </div>
    </div>);
  }

  testComponents() {
    return (<div>
      <_Test /> {/*Feel free to remove me!*/}
    </div>);
  }

  render () {
    if (this.state.view === 'home') {
      var view = this.homeView();
    } else if (this.state.view === 'favorites') {
      var view = this.favoritesView();
    }

    return (
      <div>
        {view}
        <Footer trivia={this.state.randomTrivia}/>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
