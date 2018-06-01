/**
 * Remove all users from the users on the
 * side of the screen.
 */
function clear_userlist () {


  /**
   * First of all clear the current userlist
   */
  while (user_list.firstChild) {
    user_list.removeChild(user_list.firstChild)
  }
}

/**
 * Put a package (message) on the screen
 * for you or others to read.
 *
 * @param {object} pkg - The package object to display
 */
function dialog_output (pkg) {
  if (pkg.to_user.length > 0) {
    dom('.chat_dialog').append('<b class="priv_msg">Private message: ' + pkg.user.username + '</b>: ' + pkg.message + '<br/>')
  } else {
    dom('.chat_dialog').append('<b>' + pkg.user.username + '</b>: ' + pkg.message + '<br/>')
  }
}

/**
 * Update the user list in the UI
 *
 * @param {array} users Array of uses to display in the chatroom.
 */
function users_output (users) {

  /**
   * First get the current select value
   * on the list. This is so we can restore
   * the selected list item after requesting
   * fow new users.
   */
  let selected_user = user_list.value

  /**
   * Before we start adding users
   * to the userlist make sure we erase
   * all the old users of the screen.
   */
  clear_userlist()

  for (let connid in users) {

    if (users.hasOwnProperty(connid)) {
      let user = users[connid]
      let elm = document.createElement('OPTION')

      elm.value = user.id
      elm.appendChild(document.createTextNode(user.username))

      if (elm.value === chat_user.id) {
        elm.disabled = 'disabled'
      }

      if (selected_user.length > 0 && elm.value === selected_user) {
        elm.selected = 'selected'
      }

      user_list.appendChild(elm)
    }
  }
}

/**
 * We need to register this browser window (client)
 * to the server. We do this so we can sent private
 * messages to other users.
 */
function register_client () {

  /**
   * Create a registration package to send to the
   * server.
   */
  let pkg = {
    'user': chat_user, /* Defined in index.php */
    'type': 'registration',
  }

  pkg = JSON.stringify(pkg)

  /**
   * Send the package to the server
   */
  conn.send(pkg)
}

/**
 * Request a list of current active
 * chat users. We do this every x seconds
 * so we can update the ui.
 */
function request_userlist () {
  setInterval(function () {
    if (conn.readyState !== WebSocket.CLOSING && conn.readyState !== WebSocket.CLOSED) {

      /**
       * Create a package to request the list of users
       */
      let pkg = {
        'user': chat_user, /* Defined in index.php */
        'type': 'userlist',
      }

      /**
       * We need a object copy of package
       * to send to dialog_output() but we
       * also want to turn the original package
       * into a string so we can send it over the
       * socket to the server.
       *
       * @type {{user, message: any}}
       */
      pkg = JSON.stringify(pkg)
      conn.send(pkg)
    }
  }, 2000)
}

/**
 * Send a chat message to the server
 */
function send_message () {

  /**
   * Catch the chat text
   * @type {any}
   */
  let chat_message = dom('.client_chat').val()

  /**
   * When to_user is empty the
   * message will be sent to all users
   * in the chat room.
   * @type {number}
   */
  let to_user = ''

  /**
   *  If a user is selected in the
   *  userlist this will mean send messages
   *  to that user.
   */
  if (user_list.value) {
    to_user = user_list.value
  }

  /**
   * Create a package to send to the
   * server.
   */
  let pkg = {
    'user': chat_user, /* Defined in index.php */
    'message': chat_message,
    'to_user': to_user,
    'type': 'message',
  }

  /**
   * We need a object copy of package
   * to send to dialog_output() but we
   * also want to turn the original package
   * into a string so we can send it over the
   * socket to the server.
   *
   * @type {{user, message: any}}
   */
  let pkg_object = pkg
  pkg = JSON.stringify(pkg)

  /**
   * Send the package to the server
   */
  conn.send(pkg)

  /**
   * Display the message we just wrote
   * to the screen.
   */
  dialog_output(pkg_object)

  /**
   * Empty the chat input bar
   * we don't need it anymore.
   */
  dom('.client_chat').val('')
}

/**
 * Start the connection
 * @type {WebSocket}
 */
let conn = new WebSocket('ws://' + socket_host + ':' + socket_port)
let user_list = dom('.user_list').get()

/**
 * Notify the user that the connection is closed
 * and disable the chat bar.
 *
 * @param {Event} event The onclose event
 */
conn.onclose = function (event) {
  console.log('Connection closed!')

  dom('.client_chat').prop('disabled', true)
  dom('.connection_alert').show()
  clear_userlist()
}

/**
 * Display a message in the terminal if
 * we run into an error.
 *
 * @param {Event} event The error event
 */
conn.onerror = function (event) {
  console.log('We have received an error!')

}

/**
 * Connection has been established
 *
 * @param {Event} event The onopen event
 */
conn.onopen = function (event) {

  console.log('Connection established!')

  dom('.client_chat').prop('disabled', false)

  /**
   * Register te client to the
   * server. This allows the server
   * to return a list of chat clients
   * to list on the side.
   */
  register_client()

  /**
   * Request the user list from
   * the server. If the server replies the user list
   * will be populated.
   */
  request_userlist()
}

/**
 * A new message (read package) has been received.
 *
 * @param {Event} event the onmessage event
 */
conn.onmessage = function (event) {
  let pkg = JSON.parse(event.data)

  if (pkg.type === 'message') {
    dialog_output(pkg)
  } else if (pkg.type === 'userlist') {
    users_output(pkg.users)
  }
}