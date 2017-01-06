import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import axios from 'axios';
import React, { PropTypes } from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux'
import { Grid, Row, Col, Navbar, Nav, NavItem, FormGroup, FormControl, Thumbnail, Button } from 'react-bootstrap'
import './index.scss';

const axiosConfig = {
  headers: {
    'Accept': 'application/vnd.twitchtv.v5+json',
    'Client-ID': '00ijhj3e3vq6sy9ryqtrka8jmxo1u3'
  }
}

let freecodecamp = 79776140
let snutzy = 25812641
let paladinsgame = 94706671
let ogamingsc2 = 71852806
let unknown = 30220059
let esl_sc2 = 24141959040
let caabuzz = 108269694
let nateinaction = 43001607
let userList = [freecodecamp, caabuzz, 44322889, 7236692, paladinsgame, nateinaction, esl_sc2, snutzy, ogamingsc2, unknown]

/* Example Object
{
  filter: 'all',
  search: '',
  users: [
    {
      id: 44322889,
      isFetching: false,
      name: Bob,
      avatar: 'https://imagelink',
      url: 'https://linktochannel',
      streaming: false
    },
    {
      id: 8473666,
      isFetching: false,
      name: Jill,
      avatar: 'https://imagelink',
      url: 'https://linktochannel',
      streaming: 'Deadly Tower of Monsters'
    }
  ]
}
*/

/*
 * Redux Action Creators
 */

const addUser = (id) => ({
  type: 'ADD_USER',
  obj: {
    id,
    isFetching: true
  }
})

const setUser = (id, name, avatar, url, streaming) => ({
  type: 'SET_USER',
  obj: {
    id,
    isFetching: false,
    name,
    avatar: (avatar) ? avatar : 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png',
    url,
    streaming: (streaming) ? streaming : 'offline'
  }
})

const setSearch = (search) => ({
  type: 'SET_SEARCH',
  search
})

const setFilter = (filter) => ({
  type: 'SET_FILTER',
  filter
})

const fetchChannel = (id) => {
  let url = 'https://api.twitch.tv/kraken/channels/' + id
  return (dispatch) => {
    axios.get(url, axiosConfig).then((response) => {
        //console.log(response.data)
        let { name, logo, url } = response.data
        return dispatch(setUser(id, name, logo, url))
      }).catch((error) => {
        console.log(error)
        return dispatch(setUser(id, 'Unknown User', null, '', 'Could not find user on Twitch'))
      });
  }
}

const fetchStream = (id) => {
  let url = 'https://api.twitch.tv/kraken/streams/' + id
  return (dispatch) => {
    dispatch(addUser(id))
    axios.get(url, axiosConfig).then((response) => {
        let { stream } = response.data
        if (stream === null) {
          return dispatch(fetchChannel(id))
        } else {
          return dispatch(setUser(id, stream.channel.name, stream.channel.logo, stream.channel.url, stream.game))
        }
      }).catch((error) => {
        console.log(error)
        return dispatch(setUser(id, 'Unknown User', null, '', 'Could not find user on Twitch'))
      });
  }
}

/*
 * Redux Reducers
 */

const filter = (state = 'all', action) => {
  switch (action.type) {
    case 'SET_FILTER':
      return action.filter
    default:
      return state
  }
}

const search = (state = '', action) => {
  switch (action.type) {
    case 'SET_SEARCH':
      return action.search
    case 'CLEAR_SEARCH':
      return ''
    default:
      return state
  }
}

const users = (state = [], action) => {
  switch (action.type) {
    case 'ADD_USER':
    return [...state, action.obj]
    case 'SET_FETCHING':
      return state.map((user) => {
        if (user.id === action.obj.id) {
          return Object.assign({}, user, {isFetching: true})
        }
        return user
      })
		case 'SET_USER':
      //console.log(action.obj)
      return state.map((user) => {
        if (user.id === action.obj.id) {
          return Object.assign({}, user, action.obj)
        }
        return user
      })
		default:
			return state
	}
}

const twitchTvApp = combineReducers({
  filter,
  search,
	users
})

/*
 * Redux Store
 */

let store = createStore(twitchTvApp, applyMiddleware(
	thunkMiddleware
))

/*
 * Redux state to console log
 */

console.log('initial state')
console.log(store.getState())
store.subscribe(() => console.log(store.getState()))


/*
 * Redux behavior tests
 */
/*
console.log('add user')
store.dispatch(fetchStream(44322889))
*/

/*
 * Helper Fns
 */

const appInit = () => {
  userList.forEach((id) => {
    store.dispatch(fetchStream(id))
  })
}
appInit()

const filterHelper = (filter, streaming, isFetching) => {
  if (filter === 'offline') {
    return (streaming === 'offline')
  } else if (filter === 'online') {
    return (streaming !== 'offline' && streaming !== 'Could not find user on Twitch')
  }
  return (!isFetching)
}

const searchHelper = (search, name, streaming) => {
  if (search.length > 0) {
    search = search.toLowerCase()
    name = name.toLowerCase()
    streaming = streaming.toLowerCase()
    return (name.startsWith(search) || streaming.startsWith(search))
  }
  return true
}

/*
 * React Presentational Components
 */

const Search = (props) => (
  <Navbar.Form pullRight>
    <FormGroup>
      <FormControl
        onChange={(e) => {
          e.preventDefault()
          return props.onSearchChange(e.target.value)
        }}
        type='text'
        placeholder='Search...' />
    </FormGroup>
  </Navbar.Form>
)
Search.propTypes =  {
  onSearchChange: PropTypes.func.isRequired
}

const FilterButtons = (props) => (
  <Nav bsStyle="pills" activeKey={props.filter} onSelect={props.onFilterChange} stacked pullRight>
    <NavItem eventKey={'all'}>All</NavItem>
    <NavItem eventKey={'online'}>Online</NavItem>
    <NavItem eventKey={'offline'}>Offline</NavItem>
  </Nav>
)
FilterButtons.propTypes =  {
	filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired
}

const ControlBar = (props) => (
	<Navbar inverse collapseOnSelect>
		<Navbar.Header>
			<Navbar.Brand>
				TwitchTV Status
			</Navbar.Brand>
			<Navbar.Toggle />
		</Navbar.Header>
		<Navbar.Collapse>
      <Search
        onSearchChange={props.handleSearchChange} />
      <FilterButtons
        filter={props.filter}
        onFilterChange={props.handleFilterChange} />
		</Navbar.Collapse>
	</Navbar>
)
ControlBar.propTypes =  {
	filter: PropTypes.string.isRequired,
  handleSearchChange: PropTypes.func.isRequired,
  handleFilterChange: PropTypes.func.isRequired
}

const User = (props) => (
	<Col xs={12} md={4}>
    <Thumbnail src={props.avatar} alt={props.name + '\'s avatar'}>
      <h3>{props.name}</h3>
      <p>{props.streaming}</p>
      <Button bsStyle='primary' href={props.url} disabled={(props.url === '')} block>
        Visit Profile
      </Button>
    </Thumbnail>
	</Col>
)
User.propTypes = {
	name: PropTypes.string,
  avatar: PropTypes.string,
  url: PropTypes.string,
  streaming: PropTypes.string
}

const UserList = (props) => (
	<Grid>
    <Row>
      <Col md={8} mdOffset={2}>
    	  {props.users.filter((user) => (
            filterHelper(props.filter, user.streaming, user.isFetching)
          )).filter((user) => (
            searchHelper(props.search, user.name, user.streaming)
          )).map((user) => (
      	    <User
      	      key={user.id}
      	      name={user.name}
              avatar={user.avatar}
              url={user.url}
              streaming={user.streaming} />
    	  ))}
      </Col>
    </Row>
	</Grid>
)
UserList.propTypes = {
	users: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  search: PropTypes.string.isRequired
}

/*
 * React-Redux Container Components
 */

const mapStateToProps = (state) => ({
	filter: state.filter
})

const mapDispatchToProps = (dispatch) => ({
	handleSearchChange: (search) => dispatch(setSearch(search)),
  handleFilterChange: (filter) => dispatch(setFilter(filter))
})

const ControlBarContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(ControlBar)

const mapStateToPropsTwo = (state) => ({
 filter: state.filter,
 search: state.search,
 users: state.users
})

const UserListContainer = connect(
 mapStateToPropsTwo
)(UserList)

/*
 * React Root Component
 */

const App = (props) => (
	<div className="App">
    <ControlBarContainer />
    <UserListContainer />
  </div>
)

/*
 * React Dom
 */

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

/* Example Twitch Responses */
/*
let searchUrl = 'https://api.twitch.tv/kraken/users?login=esl_sc2&api_version=5'
axios.get(searchUrl, axiosConfig).then((response) => {
    console.log('search', response.data)
  }).catch((err) => {
    console.log(err)
  });

let streamUrl = 'https://api.twitch.tv/kraken/streams/30220059'
axios.get(streamUrl, axiosConfig).then((response) => {
  console.log('streams', response.data)
  }).catch((err) => {
    console.log(err)
  });

let channelUrl = 'https://api.twitch.tv/kraken/channels/30220059'
axios.get(streamUrl, axiosConfig).then((response) => {
  console.log('channels', response.data)
  }).catch((err) => {
    console.log(err)
  });
*/
