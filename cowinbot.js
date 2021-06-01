const axios = require('axios')
const moment = require('moment')
const {twilioSID, twilioToken, receiver, pincode} = require('./config.json')
const twilio = require('twilio')
const client = new twilio(twilioSID, twilioToken)

let centerLog = []

// regular logger... but interval
const getData = async() => {
    const time = Math.floor(Math.random() * 120000) + (4*60000)
    console.log(time/60000)
    const responseD0 = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${moment().format('DD-MM-YYYY')}`)
    const responseD1 = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${moment().add(1, 'd').format('DD-MM-YYYY')}`)
    const responseD2 = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${moment().add(2, 'd').format('DD-MM-YYYY')}`)
    const combCenters = [...responseD0.data.centers.map(center => ({...center, date: center.date = moment().format('DD-MM-YYYY')})),
        ...responseD1.data.centers.map(center => ({...center, date: center.date = moment().add(1, 'd').format('DD-MM-YYYY')})),
        ...responseD2.data.centers.map(center => ({...center, date: center.date = moment().add(2, 'd').format('DD-MM-YYYY')}))]
    dataLog = combCenters.filter(center => center.fee_type == 'Paid' && center.sessions.find(session => session.min_age_limit == 18 && session.available_capacity_dose1 > 0)).map(center => ({name: center.name, sessions: center.sessions, from: center.from, to: center.to}))
    centers = combCenters.filter(center => center.fee_type == 'Paid' && center.sessions.find(session => session.min_age_limit == 18)).map(center => ({name: center.name, date: center.date}))
    newCenters = centers.filter(newCenter => !centerLog.find(oldCenter => oldCenter.name == newCenter.name && oldCenter.date == newCenter.date))

    if(dataLog.length > 0) {
        console.log(moment().format('DD-MM, hh:mm:ss a'), dataLog, dataLog[0])
        client.messages
        .create({
           from: 'whatsapp:+14155238886',
           body: JSON.stringify(dataLog),
           to: `whatsapp:${receiver}`
         })
        .then(message => console.log(message.sid));
    } else if(newCenters.length > 0) {
        console.log(moment().format('DD-MM, hh:mm:ss a'), centers)
        client.messages
        .create({
           from: 'whatsapp:+14155238886',
           body: JSON.stringify(centers),
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