const express = require('express');
const cors = require('cors')
const chat = require('./controllers/chat')
const path=require('path');
const app = express();

const http = require('http').createServer(app);

// socket io
const io = require('socket.io')(http,{
    path : '/socket.io',
    cors : {
        origin : ['https://temp-chat-mern.herokuapp.com/'],
        method : ["GET","POST"],
        allowHeaders : ["content-type"],
    }
});

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/hi", (req, res) => {
    res.send("Rahul Roy");
  });

chat(io);


if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'))
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname,  "client/build", "index.html"));
      });
}

const port = process.env.PORT || 8000;
http.listen(port, () => console.log(`Server running on port ${port}`));