"use client"
import { useState } from "react"

export default function Home() {
  const [url, setUrl] = useState("")
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")

  async function submitQuery(query : string) {
    console.log("Query recieved : " , {query} )
    const res = await fetch("http://127.0.0.1:8000/query",{
      method : "POST",
      headers : {'Content-Type' : "application/json"},
      body : JSON.stringify({query:query})
    } )
    const data = await res.json()
    setAnswer(data)
    return console.log(data)
  }

  async function submitUrl(url : string) {
    console.log("Url Recieved")
    const res =  await fetch("http://127.0.0.1:8000/ingest",{
      method : "POST",
      headers : {'Content-Type' : "application/json"},
      body : JSON.stringify({url:url})
    })
    const data = await res.json()
    return console.log(data)
  }
  return( 
  <>
  <h1>Hi</h1>
  
  
    <label>
      Query Input :
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded p-1"/>
      <button onClick={() => submitQuery(query)} className= "border rounded p-1" >Ask</button>      
    </label>

    <label>
      URL : 
      <input value={url} onChange={(e) => setUrl(e.target.value)} className="border rounded p-1"/>
      <button onClick={() => submitUrl(url)} className= "border rounded p-1" >Add Info</button>      
    </label>

    <label>
      <h2>LLM Answer : </h2>
      <p>{answer}</p>
    </label>

  </>
  )
  



}