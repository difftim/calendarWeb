// import { uniq } from 'lodash';
// import { unstable_batchedUpdates } from 'react-dom';

// export const createNativeMeeting = (
//   time: {
//     start: number;
//     end?: number;
//     resourceId: string;
//     id?: string;
//     isBossProxy?: boolean;
//   } | null = null,
//   showFindTime = false
// ) => {
//   if (isScheduleOpened('meeting')) {
//     return;
//   }

//   const users = time?.isBossProxy
//     ? [time?.resourceId]
//     : uniq([props.ourNumber, time?.resourceId].filter(Boolean));

//   const [me, other] = users.map(getNameAndInfo);
//   const meetingMembers = [{ ...me.info, isRemovable: false }];

//   if (other) {
//     meetingMembers.push(other.info);
//   }

//   unstable_batchedUpdates(() => {
//     setCurrentFreeTimeId(time?.id || '');
//     setCurrentEid('');
//     setCurrentSource('');
//     setCurrentCid('default');

//     setDialogInfo(info => ({
//       ...info,
//       key: Date.now(),
//       visible: true,
//       scheduleType: 'meeting',
//       showFindTime,
//       meetingName: `${other?.name ? `${me.name} and ${other.name}` : me.name}'s Meeting`,
//       detail: time?.start
//         ? {
//             start: time.start,
//             duration: time.end ? Math.round((time.end - time.start) / 60) : 30,
//           }
//         : null,
//       isPreviewMode: false,
//       isPrivate: true,
//       groupInfo: undefined,
//       members: meetingMembers,
//       openType: time ? 'freeTime' : '',
//       currentUserId: time?.isBossProxy ? time?.resourceId || ourNumber : ourNumber,
//     }));
//   });
// };
