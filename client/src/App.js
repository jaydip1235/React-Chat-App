import { useState, useEffect } from "react";
import socket from "./socket";
import toast, { Toaster } from "react-hot-toast";
import ScrollToBottom from "react-scroll-to-bottom";
import { css } from "@emotion/css";

const ROOT_CSS = css({
  height: 650,
  width: "100%",
});

function App() {

  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState({
    type:'',
    data_rec:''
  });
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [textEnable, setTextEnable] = useState(true)
  const [textEnablePrivate, setTextEnablePrivate]= useState(true)

  const [privateMessage, setPrivateMessage] = useState({
    type:'',
    data_recc:''
  });
  useEffect(() => {
    socket.on("user joined", (msg) => {
      console.log("user joined message", msg);
    });

    socket.on("message", (data) => {
       console.log("message", message);
      // setMessages((previousMessages) => [...previousMessages, message]);
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: data.id,
          name: data.name,
          message: data.m.data_rec,
          type: data.m.type
        },
      ]);
    });

    return () => {
      socket.off("user joined");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    socket.on("user connected", (user) => {
      user.connected = true;
      user.messages = [];
      user.hasNewMessages = false;
      setUsers((prevUsers) => [...prevUsers, user]);
      toast.success(`${user.username} joined`);
    });

    socket.on("users", (users) => {
      // setUsers(users);
      users.forEach((user) => {
        user.self = user.userID === socket.id;
        user.connected = true;
        user.messages = [];
        user.hasNewMessages = false;
      });
      // put the current user first, and sort by username
      const sorted = users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });

      setUsers(sorted);
    });

    socket.on("username taken", () => {
      toast.error("Username taken");
    });

    return () => {
      socket.off("users");
      socket.off("user connected");
      socket.off("username taken");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("user disconnected", (id) => {
      let allUsers = users;

      let index = allUsers.findIndex((el) => el.userID === id);
      let foundUser = allUsers[index];
      foundUser.connected = false;

      allUsers[index] = foundUser;
      setUsers([...allUsers]);
      // disconnected alert
      toast.error(`${foundUser.username} left`);
    });

    return () => {
      socket.off("user disconnected");
    };
  }, [users, socket]);


  useEffect(() => {
    socket.on("typing", (data) => {
      setTyping(data);
      setTimeout(() => {
        setTyping("");
      }, 1000);
    });

    return () => {
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    socket.on("private message", ({ mm, from }) => {
      // console.log("message > ", message, "from > ", from);
      const allUsers = users;
      let index = allUsers.findIndex((u) => u.userID === from);
      let foundUser = allUsers[index];

      foundUser.messages.push({
        type:mm.type,
        message:mm.data_rec_private,
        fromSelf: false,
      });

      if (foundUser) {
        console.log("asdassidkfhbsdmf1")
        if (selectedUser) {
          console.log("asdassidkfhbsdmf2")
          if (foundUser.userID !== selectedUser.userID) {
            console.log("asdassidkfhbsdmf3")
            foundUser.hasNewMessages = true;
          }
        } else {
          foundUser.hasNewMessages = true;
        }

        allUsers[index] = foundUser;
        setUsers([...allUsers]);
      }
    });

    return () => {
      socket.off("private message");
    };
  }, [users]);

  const handleUsername = (e) => {
    e.preventDefault();
    // console.log(username);
    // socket.emit("username", username);
    // setConnected(true);
    socket.auth = { username };
    socket.connect();
    console.log(socket.auth);
    console.log(socket.connected)
    // setConnected(true);
   
    setTimeout(() => {
      if (socket.connected) {
        console.log("socket.connected", socket);
        setConnected(true);
      }
    }, 1000);
    
  };

  const handleMessage = (e) => {
    let t
    if(textEnable==true) t="text"
    else t="im"

    console.log(message)
    e.preventDefault();
    socket.emit("message", {
      id: Date.now(),
      name: username,
      m:{type:t, data_rec:message.data_rec},
    });
    setMessage({  type:'',data_rec:''})
   // console.log("Heeeee")
  };

  if (message.data_rec) {
    socket.emit("typing", username);
  }

 

  const handleUsernameClick = (user) => {
    if (user.self || !user.connected) return;
    setSelectedUser({ ...user, hasNewMessages: false });

    let allUsers = users;
    let index = allUsers.findIndex((u) => u.userID === user.userID);
    let foundUser = allUsers[index];
    foundUser.hasNewMessages = false;

    allUsers[index] = foundUser;
    setUsers([...allUsers]);
  };


  const uploadImage=async(e)=>{
    const file=e.target.files[0];
    const base64=await convertBase64(file);
    setMessage({...message, data_rec: base64.toString()})
  }

  const uploadImage2=async(e)=>{
    const file=e.target.files[0];
    const base64=await convertBase64(file);
    setPrivateMessage({...privateMessage, data_recc: base64.toString()})
  }
  
  const convertBase64=(file)=>{
    return new Promise((resolve,reject)=>{
      const fileReader=new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload=()=>{
        resolve(fileReader.result);
      }
      
      fileReader.onerror=(err)=>{
        reject(err);
      }
    })
  }



  const handlePrivateMessage = (e) => {



    let tt
    if(textEnablePrivate==true) tt="text"
    else tt="im"

    e.preventDefault();
   
    console.log("lllllll")
    if (selectedUser) {
      socket.emit("private message", {
        mm: {type:tt, data_rec_private : privateMessage.data_recc},
        to: selectedUser.userID,
      });

      let updated = selectedUser;
      updated.messages.push({
        type:tt,
        message: privateMessage.data_recc,
        fromSelf: true,
        hasNewMessages: false,
      });
      console.log(updated);
      setSelectedUser(updated);
      setPrivateMessage({  type:'',data_recc:''})
    }
  };

  return (
    <div className="container-fluid">
      <Toaster />
      <div className="row bg-primary text-center">
        <h1 className="fw-bold pt-2 text-light">
          ASSIGNMENT-2
        </h1>
        <br />
        <p className="lead text-light"> Name : Jaydip Dey... Roll:001910501014 </p>
      </div>

      {!connected && (
        <div className="row">
          <form onSubmit={handleUsername} className="text-center pt-3">
            <div className="row g-3">
              <div className="col-md-8">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  placeholder="Enter your name"
                  className="form-control"
                 
                />
              </div>

              <div className="col-md-4">
                <button className="btn btn-secondary" type="submit">
                  Join
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="row">
        <div className="col-md-2 pt-3">
          {connected &&
            users.map((user) => (
              <div
                key={user.userID}
                onClick={() => handleUsernameClick(user)}
                style={{
                  textDecoration:
                    selectedUser?.userID == user.userID && "underline",
                  cursor: !user.self && "pointer",
                }}
              >
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)}{" "}
                {user.self && "(yourself)"}{" "}
                {user.connected ? (
                  <span className="online-dot"></span>
                ) : (
                  <span className="offline-dot"></span>
                )}

                {user.hasNewMessages && <b className="text-danger">_ _ _</b>}
                {user.hasNewMessages && (
                  <b className="text-danger">
                    {user.hasNewMessages && user.messages.length}
                  </b>
                )}
              </div>
            ))}
        </div>

        {connected && (
          <div className="col-md-5">



<div class="form-check">
  <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios1" value="option1" checked={!textEnable} onChange={e=>setTextEnable(!e.target.checked)}
  />
  <label class="form-check-label" for="exampleRadios1">
    Image
  </label>
</div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios2" value="option2"  checked={textEnable} onChange={e=>setTextEnable(e.target.checked)}
  />
  <label class="form-check-label" for="exampleRadios2">
    Text
  </label>
</div>



            <form onSubmit={handleMessage} className="text-center pt-3">
              <div className="row g-3">
                <div className="col-10">
                  <input
                    value={message.data_rec}
                    onChange={(e) => setMessage({...message, data_rec: e.target.value})}
                    type="text"
                    placeholder="Type your message (public)"
                    className="form-control"
                    type= { textEnable===false ?"hidden":""}
                  />


                  {/* <pre>{JSON.stringify(messages)}</pre>
                  <pre>{JSON.stringify(message.data_rec)}</pre> */}
                  {!textEnable && 
                  <input class="form-control" type="file" id="formFile" onChange={(e)=>{uploadImage(e)}}/>
                  }

                </div>

                <div className="col-2">
                  <button className="btn btn-secondary" type="submit">
                    Send
                  </button>
                </div>
              </div>
            </form>

            <br />

            <div className="col">
            {typing && typing}
              <ScrollToBottom className={ROOT_CSS}>
                {messages.map((m) => (
                  <div className="alert alert-secondary" key={m.id}>
                    {m.name.charAt(0).toUpperCase() + m.name.slice(1)} -{" "}
                    {m.type=="im" && <img  src={m.message}/>}
                    {m.type=="text" && m.message}
                  </div>
                ))}
              </ScrollToBottom>
              <br />
             
            </div>
          </div>
        )}

        <br />

        {selectedUser && (
          <div className="col-md-5">

<div class="form-check">
  <input class="form-check-input" type="radio" name="exampleRadios1" id="exampleRadios11" value="option11" checked={!textEnablePrivate} onChange={e=>setTextEnablePrivate(!e.target.checked)}
  />
  <label class="form-check-label" for="exampleRadios11">
    Image
  </label>
</div>
<div class="form-check">
  <input class="form-check-input" type="radio" name="exampleRadios2" id="exampleRadios22" value="option22"  checked={textEnablePrivate} onChange={e=>setTextEnablePrivate(e.target.checked)}
  />
  <label class="form-check-label" for="exampleRadios22">
    Text
  </label>
</div>

            <form onSubmit={handlePrivateMessage} className="text-center pt-3">
              <div className="row g-3">
                <div className="col-10">
                  <input
                    value={privateMessage.data_recc}
                    onChange={(e) =>setPrivateMessage({...privateMessage, data_recc: e.target.value})}
                    type="text"
                    placeholder="Type your message (private)"
                    className="form-control"
                    type= { textEnablePrivate===false ?"hidden":""}
                  />
                </div>


                {!textEnablePrivate && 
                  <input class="form-control" type="file" id="formFile2" onChange={(e)=>{uploadImage2(e)}}/>
                  }
                  {/* <pre>{JSON.stringify(privateMessage)}</pre> */}
                <div className="col-2">
                  <button className="btn btn-secondary" type="submit">
                    Send
                  </button>
                </div>
              </div>
            </form>

            <br />

            <div className="col">
              {/* <pre>{JSON.stringify(selectedUser.messages)}</pre> */}
              <ScrollToBottom className={ROOT_CSS}>
                {selectedUser &&
                  selectedUser.messages &&
                  selectedUser.messages.map((msg, index) => (
                    <div key={index} className="alert alert-secondary">
                      {msg.fromSelf
                        ? "(yourself)"
                        : selectedUser.username.charAt(0).toUpperCase() +
                          selectedUser.username.slice(1)}{" "}
                      {" - "}
                      {/* {msg.message} */}
                    {msg.type=="im" && <img  src={msg.message}/>}
                    {msg.type=="text" && msg.message}
                    </div>
                  ))}
              </ScrollToBottom>
              <br />
              {typing && typing}
            </div>
          </div>
        )}

        <br />
      </div>

  
    </div>
  );
}

export default App;