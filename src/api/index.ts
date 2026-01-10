export const addLiveStreamToCalendar = async (eid: string) => {
  console.log('eid', eid);
  return {
    status: 0,
    data: {
      content: 'test',
    },
  } as any;
};

export const deleteMeeting = async (eid: string) => {
  console.log('eid', eid);
  return {
    status: 0,
    data: {
      content: 'test',
    },
  };
};

export const goingScheduleMeeting = async (...args: any[]) => {
  console.log('args', args);
  return {
    status: 0,
    reason: 'test',
    data: {
      content: 'test',
    },
  } as any;
};

export const scheduleMeetingReceiveNotify = async (...args: any[]) => {
  console.log('args', args);
  return {
    status: 0,
    data: {
      content: 'test',
    },
  } as any;
};

export const copyScheduleMeetingInfo = async (...args: any[]) => {
  console.log('args', args);
  return {
    status: 0,
    data: {
      content: 'test',
    },
  } as any;
};

export const deleteMeetingSchedule = async (...args: any[]) => {
  console.log('args', args);
  return {
    status: 0,
    data: {
      content: 'test',
    },
  } as any;
};
