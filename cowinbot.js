const axios = require('axios')
const moment = require('moment')
const {twilioSID, twilioToken, receiver, pincode} = require('./config.json')
const twilio = require('twilio')
const client = new twilio(twilioSID, twilioToken)

let centerLog = []
// regular logger... but interval
const getData = async() => {
    const time = Math.floor(Math.random() * 5000) + 60000
    console.log(time/60000)
    const response = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${moment().format('DD-MM-YYYY')}`)

    const centers = response.data.centers.filter(center => center.fee_type == 'Paid' && center.sessions.find(session => session.min_age_limit == 18)).map(center => ({name: center.name, sessions: center.sessions.filter(session => session.min_age_limit == 18).map(session => ({date: session.date, id: session.session_id}))}))
    
    const availableCenters = response.data.centers.filter(center => center.fee_type == 'Paid' && center.sessions.find(session => session.min_age_limit == 18 && session.available_capacity_dose1 > 0)).map(center => ({name: center.name, sessions: center.sessions.filter(session => session.min_age_limit ==18), from: center.from, to: center.to}))
    
    const newCenters = centers.filter(center => {
        const oldCenter = centerLog.find(oldCenter => oldCenter.name == center.name)
        if (!oldCenter) return center
        else {
            center.sessions.forEach(session => {
                if (!oldCenter.sessions.find(oldSession => oldSession.session_id == session.id)) {
                    return center
                }
            })
        }
    })

    if(availableCenters.length > 0) {
        console.log(moment().format('DD-MM, hh:mm:ss a'), availableCenters)
        client.messages
        .create({
           from: 'whatsapp:+14155238886',
           body: `New Center Alert! ${JSON.stringify(availableCenters.map(center => center.name))}
            ${JSON.stringify(availableCenters)}`,
           to: `whatsapp:${receiver}`
         })
        .then(message => console.log(message.sid));
    } else if(newCenters.length > 0) {
        console.log(moment().format('DD-MM, hh:mm:ss a'), centers, JSON.stringify(newCenters))
        client.messages
        .create({
           from: 'whatsapp:+14155238886',
           body: `New slots were opened, but you missed it 
           ${JSON.stringify(centers)}`,
           to: `whatsapp:${receiver}`
         })
        .then(message => console.log(message.sid));
    } else {
        console.log(moment().format('DD-MM, hh:mm:ss a'), 'No change')
    }

    centerLog = centers
    setTimeout(getData, time)
}


getData()