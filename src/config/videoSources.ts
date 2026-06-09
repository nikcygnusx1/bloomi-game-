export const VIDEO_SOURCES = {
  intro_act1_cern: 'YOUTUBE_VIDEO_ID_HERE',
  intro_act3_bloomberg: 'YOUTUBE_VIDEO_ID_HERE',
  intro_act3_palantir: 'YOUTUBE_VIDEO_ID_HERE',
  panel_feed_1: 'YOUTUBE_VIDEO_ID_HERE',
  panel_feed_2: 'YOUTUBE_VIDEO_ID_HERE',
  panel_feed_3: 'YOUTUBE_VIDEO_ID_HERE',
};

// Fill these in with real YouTube video IDs before deploying.
// Leave as empty string '' to trigger SIGNAL_OFFLINE state for that feed.
export const VIDEO_PANEL_SOURCES = {
  cern:    '',   // e.g. LHC flythrough, particle collision visualization
  markets: '',   // e.g. Bloomberg trading floor, market data visualization
  intel:   '',   // e.g. Palantir network graph demo, data ops footage
  atmo:    '',   // e.g. Storm satellite footage, atmospheric timelapse
};
