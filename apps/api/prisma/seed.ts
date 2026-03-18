import {
  AdminRole,
  AuditActorType,
  BookingSource,
  BookingStatus,
  BookingType,
  Channel,
  ConversationStatus,
  CourtType,
  CustomerSegment,
  EventType,
  Intent,
  Language,
  MessageRole,
  Prisma,
  PrismaClient,
  SurfaceType
} from "@prisma/client";

const prisma = new PrismaClient();

const seedIds = {
  policy: "00000000-0000-0000-0000-000000000001",
  admins: {
    owner: "00000000-0000-0000-0000-000000000011",
    manager: "00000000-0000-0000-0000-000000000012",
    staff: "00000000-0000-0000-0000-000000000013"
  },
  courts: {
    court1: "00000000-0000-0000-0000-000000000101",
    court2: "00000000-0000-0000-0000-000000000102",
    court3: "00000000-0000-0000-0000-000000000103",
    court4: "00000000-0000-0000-0000-000000000104",
    court5: "00000000-0000-0000-0000-000000000105"
  },
  eventPackages: {
    birthday: "00000000-0000-0000-0000-000000000201",
    privateEvent: "00000000-0000-0000-0000-000000000202",
    corporate: "00000000-0000-0000-0000-000000000203"
  },
  customers: {
    ahmad: "00000000-0000-0000-0000-000000000301",
    noor: "00000000-0000-0000-0000-000000000302",
    yazan: "00000000-0000-0000-0000-000000000303",
    dana: "00000000-0000-0000-0000-000000000304"
  },
  conversations: {
    booking: "00000000-0000-0000-0000-000000000401",
    inquiry: "00000000-0000-0000-0000-000000000402",
    modification: "00000000-0000-0000-0000-000000000403"
  },
  bookings: {
    upcoming: "00000000-0000-0000-0000-000000000501",
    completed: "00000000-0000-0000-0000-000000000502",
    cancelled: "00000000-0000-0000-0000-000000000503"
  },
  blocks: {
    maintenance: "00000000-0000-0000-0000-000000000601",
    privateUse: "00000000-0000-0000-0000-000000000602"
  }
} as const;

const decimal = (value: number) => new Prisma.Decimal(value);

const now = new Date("2026-03-16T12:00:00+03:00");

const futureDate = (daysFromNow: number, hour: number, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
};

async function main() {
  await prisma.conversationMessage.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.eventExtra.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.courtUnavailability.deleteMany();
  await prisma.eventPackage.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.court.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.bookingPolicy.deleteMany();

  await prisma.bookingPolicy.create({
    data: {
      id: seedIds.policy,
      timezone: "Asia/Amman",
      slotIntervalMins: 60,
      minBookingDurationMins: 60,
      maxBookingDurationMins: 180,
      minLeadTimeMins: 120,
      cancellationCutoffMins: 180,
      modificationCutoffMins: 180,
      openingTime: "16:00",
      closingTime: "01:00"
    }
  });

  await prisma.adminUser.createMany({
    data: [
      {
        id: seedIds.admins.owner,
        email: "owner@aldawood.local",
        passwordHash: "seed-password-hash-owner",
        name: "Omar Al-Dawood",
        role: AdminRole.owner
      },
      {
        id: seedIds.admins.manager,
        email: "manager@aldawood.local",
        passwordHash: "seed-password-hash-manager",
        name: "Laith Haddad",
        role: AdminRole.manager
      },
      {
        id: seedIds.admins.staff,
        email: "staff@aldawood.local",
        passwordHash: "seed-password-hash-staff",
        name: "Raneem Al-Majali",
        role: AdminRole.staff
      }
    ]
  });

  await prisma.court.createMany({
    data: [
      {
        id: seedIds.courts.court1,
        name: "Court 1",
        nameAr: "ملعب 1",
        type: CourtType.V5,
        surface: SurfaceType.artificial_grass,
        capacity: 10,
        hourlyRate: decimal(28),
        peakRate: decimal(35),
        locationLat: decimal(31.9544),
        locationLng: decimal(35.9106),
        mapsLink: "https://maps.google.com/?q=31.9544,35.9106"
      },
      {
        id: seedIds.courts.court2,
        name: "Court 2",
        nameAr: "ملعب 2",
        type: CourtType.V5,
        surface: SurfaceType.artificial_grass,
        capacity: 10,
        hourlyRate: decimal(28),
        peakRate: decimal(35),
        locationLat: decimal(31.9562),
        locationLng: decimal(35.9131),
        mapsLink: "https://maps.google.com/?q=31.9562,35.9131"
      },
      {
        id: seedIds.courts.court3,
        name: "Court 3",
        nameAr: "ملعب 3",
        type: CourtType.V7,
        surface: SurfaceType.artificial_grass,
        capacity: 14,
        hourlyRate: decimal(42),
        peakRate: decimal(52),
        locationLat: decimal(31.9588),
        locationLng: decimal(35.9084),
        mapsLink: "https://maps.google.com/?q=31.9588,35.9084"
      },
      {
        id: seedIds.courts.court4,
        name: "Court 4",
        nameAr: "ملعب 4",
        type: CourtType.V7,
        surface: SurfaceType.artificial_grass,
        capacity: 14,
        hourlyRate: decimal(45),
        peakRate: decimal(55),
        locationLat: decimal(31.9612),
        locationLng: decimal(35.9049),
        mapsLink: "https://maps.google.com/?q=31.9612,35.9049"
      },
      {
        id: seedIds.courts.court5,
        name: "Main Stadium",
        nameAr: "الملعب الرئيسي",
        type: CourtType.V11,
        surface: SurfaceType.natural_grass,
        capacity: 22,
        hourlyRate: decimal(80),
        peakRate: decimal(95),
        locationLat: decimal(31.9635),
        locationLng: decimal(35.9004),
        mapsLink: "https://maps.google.com/?q=31.9635,35.9004"
      }
    ]
  });

  await prisma.pricingRule.createMany({
    data: [
      {
        id: "00000000-0000-0000-0000-000000000701",
        name: "Weekday 5v5 Afternoon",
        courtId: seedIds.courts.court1,
        priority: 10,
        dayOfWeek: 1,
        startHour: 16,
        endHour: 19,
        price: decimal(28)
      },
      {
        id: "00000000-0000-0000-0000-000000000702",
        name: "Weekday 5v5 Peak",
        courtId: seedIds.courts.court1,
        priority: 20,
        dayOfWeek: 1,
        startHour: 19,
        endHour: 24,
        price: decimal(35),
        isPeak: true
      },
      {
        id: "00000000-0000-0000-0000-000000000703",
        name: "Weekday 5v5 Afternoon Court 2",
        courtId: seedIds.courts.court2,
        priority: 10,
        dayOfWeek: 1,
        startHour: 16,
        endHour: 19,
        price: decimal(28)
      },
      {
        id: "00000000-0000-0000-0000-000000000704",
        name: "Weekday 5v5 Peak Court 2",
        courtId: seedIds.courts.court2,
        priority: 20,
        dayOfWeek: 1,
        startHour: 19,
        endHour: 24,
        price: decimal(35),
        isPeak: true
      },
      {
        id: "00000000-0000-0000-0000-000000000705",
        name: "Weekday 7v7 Peak",
        courtId: seedIds.courts.court3,
        priority: 20,
        dayOfWeek: 1,
        startHour: 18,
        endHour: 24,
        price: decimal(52),
        isPeak: true
      },
      {
        id: "00000000-0000-0000-0000-000000000706",
        name: "Weekend 7v7 Peak",
        courtId: seedIds.courts.court4,
        priority: 20,
        dayOfWeek: 5,
        startHour: 17,
        endHour: 24,
        price: decimal(55),
        isPeak: true
      },
      {
        id: "00000000-0000-0000-0000-000000000707",
        name: "Main Stadium Match Rate",
        courtId: seedIds.courts.court5,
        priority: 30,
        dayOfWeek: 4,
        startHour: 18,
        endHour: 24,
        price: decimal(95),
        isPeak: true
      }
    ]
  });

  await prisma.eventPackage.createMany({
    data: [
      {
        id: seedIds.eventPackages.birthday,
        name: "Birthday Football Package",
        nameAr: "باقة عيد ميلاد كروي",
        type: EventType.birthday,
        description: "Court booking with decorations and kids setup.",
        descriptionAr: "حجز ملعب مع زينة وتجهيزات خاصة للأطفال.",
        basePrice: decimal(140),
        maxGuests: 20,
        includesDecorations: true,
        includesCatering: false,
        durationMins: 120
      },
      {
        id: seedIds.eventPackages.privateEvent,
        name: "Private Event Package",
        nameAr: "باقة فعالية خاصة",
        type: EventType.private_event,
        description: "Private court use with seating and host support.",
        descriptionAr: "استخدام خاص للملعب مع جلسات ودعم تنظيمي.",
        basePrice: decimal(180),
        maxGuests: 30,
        includesDecorations: false,
        includesCatering: true,
        durationMins: 180
      },
      {
        id: seedIds.eventPackages.corporate,
        name: "Corporate Tournament Package",
        nameAr: "باقة بطولة شركات",
        type: EventType.corporate,
        description: "Mini corporate football day with organizer support.",
        descriptionAr: "يوم كروي للشركات مع دعم تنظيمي.",
        basePrice: decimal(260),
        maxGuests: 40,
        includesDecorations: false,
        includesCatering: true,
        durationMins: 240
      }
    ]
  });

  await prisma.customer.createMany({
    data: [
      {
        id: seedIds.customers.ahmad,
        phone: "+962790123456",
        name: "Ahmad Al-Khaldi",
        email: "ahmad@example.com",
        preferredLang: Language.ar,
        segment: CustomerSegment.regular,
        totalBookings: 8,
        totalSpent: decimal(256),
        preferences: { favoriteCourtType: "V5", preferredTime: "21:00" }
      },
      {
        id: seedIds.customers.noor,
        phone: "+962791234567",
        name: "Noor Al-Smadi",
        email: "noor@example.com",
        preferredLang: Language.ar,
        segment: CustomerSegment.occasional,
        totalBookings: 3,
        totalSpent: decimal(126),
        preferences: { eventInterest: "birthday", preferredTime: "18:00" }
      },
      {
        id: seedIds.customers.yazan,
        phone: "+962792345678",
        name: "Yazan Al-Zoubi",
        email: "yazan@example.com",
        preferredLang: Language.en,
        segment: CustomerSegment.new,
        totalBookings: 1,
        totalSpent: decimal(45),
        preferences: { favoriteCourtType: "V7" }
      },
      {
        id: seedIds.customers.dana,
        phone: "+962793456789",
        name: "Dana Al-Majali",
        email: "dana@example.com",
        preferredLang: Language.ar,
        segment: CustomerSegment.vip,
        totalBookings: 14,
        totalSpent: decimal(980),
        preferences: { eventInterest: "private_event", notes: "Usually books for groups." }
      }
    ]
  });

  await prisma.courtUnavailability.createMany({
    data: [
      {
        id: seedIds.blocks.maintenance,
        courtId: seedIds.courts.court2,
        createdByAdminId: seedIds.admins.manager,
        reason: "Lighting maintenance",
        startTime: futureDate(2, 16),
        endTime: futureDate(2, 18)
      },
      {
        id: seedIds.blocks.privateUse,
        courtId: seedIds.courts.court5,
        createdByAdminId: seedIds.admins.owner,
        reason: "School championship block",
        startTime: futureDate(4, 18),
        endTime: futureDate(4, 22)
      }
    ]
  });

  await prisma.conversation.createMany({
    data: [
      {
        id: seedIds.conversations.booking,
        customerId: seedIds.customers.ahmad,
        channel: Channel.web_test,
        status: ConversationStatus.completed,
        intent: Intent.booking,
        summary: "Customer booked a 5v5 court for tomorrow at 21:00.",
        resolved: true,
        startedAt: futureDate(-1, 20),
        lastMessageAt: futureDate(-1, 20, 15),
        endedAt: futureDate(-1, 20, 16)
      },
      {
        id: seedIds.conversations.inquiry,
        customerId: seedIds.customers.noor,
        channel: Channel.web_test,
        status: ConversationStatus.active,
        intent: Intent.general_inquiry,
        summary: "Asked about birthday package details.",
        resolved: false,
        startedAt: futureDate(0, 14),
        lastMessageAt: futureDate(0, 14, 5)
      },
      {
        id: seedIds.conversations.modification,
        customerId: seedIds.customers.dana,
        channel: Channel.web_test,
        status: ConversationStatus.waiting_customer,
        intent: Intent.modification,
        summary: "Requested to move an event booking to a later time.",
        resolved: false,
        startedAt: futureDate(0, 17),
        lastMessageAt: futureDate(0, 17, 20)
      }
    ]
  });

  await prisma.conversationMessage.createMany({
    data: [
      {
        id: "00000000-0000-0000-0000-000000000801",
        conversationId: seedIds.conversations.booking,
        role: MessageRole.user,
        content: "I want to book tomorrow at 9 pm for one hour."
      },
      {
        id: "00000000-0000-0000-0000-000000000802",
        conversationId: seedIds.conversations.booking,
        role: MessageRole.assistant,
        content: "Confirmed. I found a 5v5 court at 9:00 pm."
      },
      {
        id: "00000000-0000-0000-0000-000000000803",
        conversationId: seedIds.conversations.inquiry,
        role: MessageRole.user,
        content: "Do you have birthday packages for kids?"
      },
      {
        id: "00000000-0000-0000-0000-000000000804",
        conversationId: seedIds.conversations.modification,
        role: MessageRole.assistant,
        content: "Please share the booking reference so I can modify it."
      }
    ]
  });

  await prisma.booking.createMany({
    data: [
      {
        id: seedIds.bookings.upcoming,
        customerId: seedIds.customers.ahmad,
        courtId: seedIds.courts.court1,
        createdByConversationId: seedIds.conversations.booking,
        bookingType: BookingType.regular,
        source: BookingSource.web_test,
        status: BookingStatus.confirmed,
        startTime: futureDate(1, 21),
        endTime: futureDate(1, 22),
        durationMins: 60,
        price: decimal(35),
        discount: decimal(0),
        confirmedAt: now,
        cancelToken: "seed-cancel-upcoming",
        modifyToken: "seed-modify-upcoming"
      },
      {
        id: seedIds.bookings.completed,
        customerId: seedIds.customers.yazan,
        courtId: seedIds.courts.court3,
        bookingType: BookingType.regular,
        source: BookingSource.admin,
        status: BookingStatus.completed,
        startTime: futureDate(-3, 19),
        endTime: futureDate(-3, 20),
        durationMins: 60,
        price: decimal(42),
        discount: decimal(0),
        confirmedAt: futureDate(-5, 11),
        cancelToken: "seed-cancel-completed",
        modifyToken: "seed-modify-completed"
      },
      {
        id: seedIds.bookings.cancelled,
        customerId: seedIds.customers.dana,
        courtId: seedIds.courts.court5,
        createdByConversationId: seedIds.conversations.modification,
        bookingType: BookingType.private_event,
        source: BookingSource.agent,
        status: BookingStatus.cancelled,
        startTime: futureDate(6, 20),
        endTime: futureDate(6, 23),
        durationMins: 180,
        price: decimal(180),
        discount: decimal(10),
        confirmedAt: futureDate(-1, 15),
        cancelledAt: futureDate(0, 17, 15),
        cancelReason: "Customer requested a different date",
        cancelToken: "seed-cancel-cancelled",
        modifyToken: "seed-modify-cancelled"
      }
    ]
  });

  await prisma.eventExtra.create({
    data: {
      id: "00000000-0000-0000-0000-000000000901",
      bookingId: seedIds.bookings.cancelled,
      packageId: seedIds.eventPackages.privateEvent,
      eventType: EventType.private_event,
      guestCount: 24,
      decorations: false,
      catering: true,
      specialRequests: "Need extra seating area.",
      packageName: "Private Event Package",
      packagePrice: decimal(180)
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        id: "00000000-0000-0000-0000-000000001001",
        actorType: AuditActorType.system,
        entityType: "seed",
        entityId: seedIds.policy,
        action: "phase_1_seed_completed"
      },
      {
        id: "00000000-0000-0000-0000-000000001002",
        actorType: AuditActorType.admin,
        actorId: seedIds.admins.manager,
        entityType: "court_unavailability",
        entityId: seedIds.blocks.maintenance,
        action: "created_block"
      }
    ]
  });

  console.log("Seed completed with Jordanian starter data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
