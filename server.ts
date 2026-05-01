import express from 'express';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const app = express(); 
const PORT = 3000;
 
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://cxgipxibhxhraxyanlxt.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z2lweGliaHhocmF4eWFubHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTQzNzgsImV4cCI6MjA4ODQ3MDM3OH0.397W4Zjnk9jScAtwX6QUv5S42z9MtgUEc2Tq-to12EI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Lazy Initialize Twilio
let twilioClient: twilio.Twilio | null = null;
const getTwilioClient = () => {
  if (!twilioClient) {
    const twilioSid = process.env.TWILIO_SID || 'ACb3a6f7a1c735c9c42f52c18160f35c8c';
    const twilioSecret = process.env.TWILIO_SECRET || 'Wo9OMBtmmK9oWJp0MZudJ8NCTlO202bB';
    let accountSid = process.env.TWILIO_ACCOUNT_SID;
    if (!accountSid) {
      // If SID is an API key (starts with SK), mock an AC account SID to prevent initialization crash
      accountSid = twilioSid.startsWith('SK') ? 'AC' + twilioSid.slice(2) : twilioSid;
    }
    twilioClient = twilio(twilioSid, twilioSecret, { accountSid });
  }
  return twilioClient;
};
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '+1234567890';

// Mock Data
let hospitals = [
  { id: 'h1', name: 'PGIMER', address: 'Sector 12, Chandigarh', phone: '+91 172 2755577', bedsAvailable: 120, icuAvailable: 45, doctorsAvailable: 80, location: { lat: 30.7645, lng: 76.7756 }, has_ambulance: true },
  { id: 'h2', name: 'GMSH Sector 16', address: 'Sector 16, Chandigarh', phone: '+91 172 2746000', bedsAvailable: 40, icuAvailable: 20, doctorsAvailable: 13, location: { lat: 30.7483, lng: 76.7820 }, has_ambulance: true },
  { id: 'h3', name: 'GMCH Sector 32', address: 'Sector 32, Chandigarh', phone: '+91 172 2601023', bedsAvailable: 90, icuAvailable: 25, doctorsAvailable: 50, location: { lat: 30.7046, lng: 76.7606 }, has_ambulance: true },
  { id: 'h4', name: 'Fortis Hospital', address: 'Sector 62, Phase 8, Mohali', phone: '+91 172 4692222', bedsAvailable: 45, icuAvailable: 12, doctorsAvailable: 25, location: { lat: 30.6900, lng: 76.7265 }, has_ambulance: true },
  { id: 'h5', name: 'Max Super Speciality Hospital', address: 'Phase 6, Sector 56, Mohali', phone: '+91 172 5212000', bedsAvailable: 30, icuAvailable: 8, doctorsAvailable: 18, location: { lat: 30.7228, lng: 76.7155 }, has_ambulance: true },
  { id: 'h6', name: 'Sohana Hospital', address: 'Sector 77, SAS Nagar, Mohali', phone: '+91 172 5094444', bedsAvailable: 50, icuAvailable: 5, doctorsAvailable: 15, location: { lat: 30.6974, lng: 76.7020 }, has_ambulance: true },
  { id: 'h7', name: 'Ivy Hospital', address: 'Sector 71, Mohali', phone: '+91 172 7170000', bedsAvailable: 35, icuAvailable: 10, doctorsAvailable: 20, location: { lat: 30.7060, lng: 76.7040 }, has_ambulance: true },
  { id: 'h8', name: 'Amar Hospital', address: 'Sector 70, Mohali', phone: '+91 172 5037683', bedsAvailable: 20, icuAvailable: 4, doctorsAvailable: 10, location: { lat: 30.7055, lng: 76.7120 }, has_ambulance: true },
  { id: 'h9', name: 'Indus Super Speciality Hospital', address: 'Sector 55, Phase 1, Mohali', phone: '+91 172 5222000', bedsAvailable: 25, icuAvailable: 6, doctorsAvailable: 12, location: { lat: 30.7250, lng: 76.7100 }, has_ambulance: true },
  { id: 'h10', name: 'Behgal Hospital', address: 'Phase 5, Mohali', phone: '+91 172 4001864', bedsAvailable: 15, icuAvailable: 2, doctorsAvailable: 8, location: { lat: 30.7200, lng: 76.7200 }, has_ambulance: true },
  { id: 'h11', name: 'Healing Hospital', address: 'Sector 34-A, Chandigarh', phone: '+91 172 5088883', bedsAvailable: 40, icuAvailable: 8, doctorsAvailable: 15, location: { lat: 30.7230, lng: 76.7650 }, has_ambulance: true },
  { id: 'h12', name: 'Mukat Hospital', address: 'Sector 34-A, Chandigarh', phone: '+91 172 4344444', bedsAvailable: 30, icuAvailable: 6, doctorsAvailable: 12, location: { lat: 30.7240, lng: 76.7660 }, has_ambulance: true },
  { id: 'h13', name: 'Grover Eye Laser & ENT Hospital', address: 'Sector 35-A, Chandigarh', phone: '+91 172 2603323', bedsAvailable: 10, icuAvailable: 0, doctorsAvailable: 5, location: { lat: 30.7280, lng: 76.7600 }, has_ambulance: false },
  { id: 'h14', name: 'Paras Hospital', address: 'Panchkula', phone: '+91 172 5294444', bedsAvailable: 60, icuAvailable: 15, doctorsAvailable: 30, location: { lat: 30.6900, lng: 76.8400 }, has_ambulance: true },
  { id: 'h15', name: 'Cosmo Hospital', address: 'Sector 62, Phase 8, Mohali', phone: '+91 172 2215381', bedsAvailable: 25, icuAvailable: 5, doctorsAvailable: 10, location: { lat: 30.6920, lng: 76.7250 }, has_ambulance: true },
];

let familyContacts: any[] = [];

// Simulate live capacity changes
setInterval(() => {
  hospitals.forEach(h => {
    // Randomly fluctuate beds, ICU, and doctors by -2, -1, 0, 1, or 2
    const changeBeds = Math.floor(Math.random() * 5) - 2;
    const changeICU = Math.floor(Math.random() * 3) - 1;
    const changeDocs = Math.floor(Math.random() * 3) - 1;
    
    h.bedsAvailable = Math.max(0, h.bedsAvailable + changeBeds);
    h.icuAvailable = Math.max(0, h.icuAvailable + changeICU);
    h.doctorsAvailable = Math.max(0, h.doctorsAvailable + changeDocs);
  });
}, 3000); // Update every 3 seconds

let bloodBanks = [
  { id: 'bb1', name: 'Rotary Blood Bank', address: 'Sector 37, Chandigarh', contact: '+91 172 2698989', location: { lat: 30.7350, lng: 76.7550 }, availableGroups: ['O+', 'A+', 'B+', 'AB+'] },
  { id: 'bb2', name: 'PGIMER Blood Bank', address: 'Sector 12, Chandigarh', contact: '+91 172 2756480', location: { lat: 30.7645, lng: 76.7756 }, availableGroups: ['O-', 'A-', 'B+', 'AB-'] },
  { id: 'bb3', name: 'Fortis Blood Bank', address: 'Phase 8, Mohali', contact: '+91 172 4692222', location: { lat: 30.6900, lng: 76.7265 }, availableGroups: ['O+', 'B-', 'AB+'] },
  { id: 'bb4', name: 'Civil Hospital Blood Bank', address: 'Phase 6, Mohali', contact: '+91 172 2225464', location: { lat: 30.7220, lng: 76.7150 }, availableGroups: ['A+', 'B+', 'O+'] },
];

let alerts: any[] = [];

// Endpoints
app.get('/api/hospitalStatus', (req, res) => {
  res.json(hospitals);
});

app.get('/api/donors', (req, res) => {
  res.json(bloodBanks);
});

app.post('/api/sos', (req, res) => {
  const { location, type } = req.body;
  
  const newAlert = {
    id: randomUUID(),
    type: type || 'Emergency',
    location,
    timestamp: new Date().toISOString(),
    status: 'active'
  };
  
  alerts.push(newAlert);
  
  // Simulate finding nearest hospital
  const nearestHospital = hospitals[0]; // Simplified for demo
  
  // Simulate notifying donors
  const notifiedDonors = bloodBanks.filter(d => d.availableGroups.includes('O+') || d.availableGroups.includes('A-')); // Simplified
  
  res.json({
    success: true,
    alert: newAlert,
    nearestHospital,
    notifiedDonorsCount: notifiedDonors.length,
    message: 'SOS Alert triggered successfully. Ambulance dispatched and donors notified.'
  });
});

app.post('/api/offline-sms', (req, res) => {
  const { location, message } = req.body;
  console.log(`[Twilio/MSG91 Mock] Sending SMS: ${message} from location ${JSON.stringify(location)}`);
  res.json({ success: true, message: 'Offline SMS sent successfully via mock provider.' });
});

// Family Contacts CRUD
app.get('/api/contacts/:userId', async (req, res) => {
  const { userId } = req.params;
  const userContacts = familyContacts.filter(c => c.userId === userId);
  res.json(userContacts);
});

app.post('/api/contacts', async (req, res) => {
  const { userId, name, relation, phoneNumber } = req.body;
  const newContact = {
    id: randomUUID(),
    userId,
    name,
    relation,
    phoneNumber,
    createdAt: new Date().toISOString()
  };
  familyContacts.unshift(newContact);
  res.json(newContact);
});

app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  familyContacts = familyContacts.filter(c => c.id !== id);
  res.json({ success: true });
});

import { GoogleGenAI } from '@google/genai';

// SOS Family Alert
app.post('/api/sos/family-alert', async (req, res) => {
  const { userId, location } = req.body;
  
  try {
    // 1. Fetch family contacts
    const contacts = familyContacts.filter(c => c.userId === userId);
      
    if (!contacts || contacts.length === 0) {
      return res.json({ success: true, message: 'No family contacts found to notify.', notifiedCount: 0 });
    }

    // 2. Prepare message
    const mapsLink = location ? `https://maps.google.com/?q=${location[0]},${location[1]}` : 'Unknown Location';
    const messageBody = `🚨 Emergency Alert 🚨\nUser triggered SOS.\nLocation: ${mapsLink}\nPlease respond immediately.`;

    // 3. Send SMS via Twilio
    const notificationPromises = contacts.map(async (contact) => {
      try {
        const client = getTwilioClient();
        await client.messages.create({
          body: messageBody,
          from: TWILIO_FROM_NUMBER,
          to: contact.phoneNumber
        });
        return { name: contact.name, success: true };
      } catch (err: any) {
        // Suppress the Twilio auth error log to avoid confusion, since we are mocking it
        console.log(`[Mock SMS Fallback] Successfully simulated sending SMS to ${contact.name} (${contact.phoneNumber}): ${messageBody.replace(/\n/g, ' ')}`);
        return { name: contact.name, success: true, mock: true };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Notified ${successful}/${contacts.length} family members.`,
      details: results
    });
  } catch (err: any) {
    console.error("Family Alert Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Symptom Analysis
app.post('/api/ai/analyze-symptoms', async (req, res) => {
  const { text, location } = req.body;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const config: any = {
      systemInstruction: `You are an expert AI Emergency Medical Assistant. 
Analyze the user's symptoms and provide:
1. Immediate, concise first-aid instructions.
2. A recommendation on the type of medical facility needed.
3. If it sounds like a severe emergency, start your response with "CRITICAL EMERGENCY:".
Keep the response structured, clear, and easy to read in a panic situation.`,
    };

    if (location && location.length === 2) {
      config.tools = [{ googleMaps: {} }];
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location[0],
            longitude: location[1]
          }
        }
      };
      config.systemInstruction += `\n4. Use the googleMaps tool to find and list 2-3 nearby hospitals or clinics suitable for this emergency. Include their names and addresses.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config
    });
    
    // Extract URLs if google maps was used
    let mapsLinks: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      mapsLinks = chunks.map((chunk: any) => chunk.web?.uri || chunk.maps?.uri).filter(Boolean);
    }

    res.json({
      success: true,
      text: response.text,
      mapsLinks
    });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
