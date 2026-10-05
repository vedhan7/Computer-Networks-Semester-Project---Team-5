import { adminDb } from './firebase-admin';

async function seedDatabase() {
  console.log('Seeding Firestore Database...');
  
  // Clean up collections (for demo purposes only, normally deleting collections requires a recursive function)
  // For this mock, we will just overwrite the specific documents.

  const batch = adminDb.batch();

  // Create 3 active classes
  const classes = [
    {
      id: 'CS101',
      roomId: 'ROOM_A',
      priority: 5,
      startTime: adminDb.doc('ClassSessions/CS101'), // just a ref placeholder, use Date below
      duration: 60,
      expectedBandwidth: 100,
      rosterMacAddresses: ['00:11:22:33:44:55', '00:11:22:33:44:56', '00:11:22:33:44:57']
    },
    {
      id: 'MATH201',
      roomId: 'ROOM_B',
      priority: 2,
      duration: 90,
      expectedBandwidth: 50,
      rosterMacAddresses: ['AA:BB:CC:DD:EE:00', 'AA:BB:CC:DD:EE:11']
    },
    {
      id: 'ENG102',
      roomId: 'ROOM_C',
      priority: 1,
      duration: 45,
      expectedBandwidth: 30,
      rosterMacAddresses: ['FF:EE:DD:CC:BB:AA']
    }
  ];

  for (const cls of classes) {
    const docRef = adminDb.collection('ClassSessions').doc(cls.id);
    batch.set(docRef, {
      ...cls,
      startTime: new Date()
    });
    
    // Initialize base telemetry
    const telRef = adminDb.collection('NetworkTelemetry').doc(cls.roomId);
    batch.set(telRef, {
      roomId: cls.roomId,
      currentBandwidth: cls.expectedBandwidth,
      connectedMacAddresses: cls.rosterMacAddresses,
      cnhsScore: 100,
      quarantineStatus: false,
      allocatedBandwidth: 0,
      matchScore: 1,
      isMigrated: false,
      lastUpdated: new Date()
    });
  }

  await batch.commit();
  console.log('Database seeded with 3 active classes.');
}

export async function simulateTraffic() {
  console.log('Starting mock traffic generation...');
  
  setInterval(async () => {
    try {
      const batch = adminDb.batch();

      // Traffic Spike in ROOM_A
      const randomTraffic = Math.floor(Math.random() * 200) + 50; 
      const roomARef = adminDb.collection('NetworkTelemetry').doc('ROOM_A');
      batch.update(roomARef, {
        currentBandwidth: randomTraffic,
        connectedMacAddresses: ['00:11:22:33:44:55', '00:11:22:33:44:56'], // Dropped one connection
        lastUpdated: new Date()
      });
      console.log(`[ROOM_A] Traffic updated: ${randomTraffic} Mbps`);

      // Ad-hoc room change simulation (CS101 students moving to ROOM_B)
      if (Math.random() > 0.7) {
        const roomBRef = adminDb.collection('NetworkTelemetry').doc('ROOM_B');
        batch.update(roomBRef, {
          currentBandwidth: 60,
          connectedMacAddresses: ['00:11:22:33:44:55', '00:11:22:33:44:56', '00:11:22:33:44:57'], // The CS101 students are now here
          lastUpdated: new Date()
        });
        console.log(`[ROOM_B] Ad-hoc migration triggered by MAC addresses matching CS101`);
      }

      await batch.commit();
      
      // After updating mock telemetry, trigger the mathematical engine to process the new data
      const { runAcornEngine } = require('./acorn-engine');
      await runAcornEngine();
      console.log('ACORN Engine processed telemetry.');
      
    } catch (err) {
      console.error('Error during mock traffic generation:', err);
    }
  }, 5000);
}

// Run if executed directly
if (require.main === module) {
  seedDatabase().then(() => simulateTraffic());
}
