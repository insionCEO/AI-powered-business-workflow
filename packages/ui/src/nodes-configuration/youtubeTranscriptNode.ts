import { NodeConfig } from "./types";

export const youtubeTranscriptNodeConfig: NodeConfig = {
  nodeName: "YoutubeTranscriptNodeName",
  processorType: "youtube_transcript_input",
  icon: "FaFilm",
  fields: [
    {
      name: "url",
      type: "input",
      required: true,
      placeholder: "URLPlaceholder",
    },
    {
      name: "language",
      type: "option",
      options: [
        {
          label: "EN",
          value: "en",
          default: true,
        },
        {
          label: "FR",
          value: "fr",
        },
        {
          label: "ES",
          value: "es",
        },
      ],
    },
  ],
  outputType: "text",
  defaultHideOutput: true,
  section: "input",
  helpMessage: "youtubeTranscriptHelp",
};
