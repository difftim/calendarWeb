// Mock implementation for web version
export const joinMeeting = (e: any, item: any) => {
  e.stopPropagation();
  console.log('Join meeting:', item);

  if (item.googleMeetingLink) {
    window.open(item.googleMeetingLink, '_blank');
  } else if (item.outlookMeetingLink) {
    window.open(item.outlookMeetingLink, '_blank');
  } else if (item.channelName) {
    // For native meetings, you would implement the actual join logic
    console.log('Joining native meeting:', item.channelName);
  }
};
