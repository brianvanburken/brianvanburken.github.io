+++
title = "Pattern matching in Javascript"
date = 2026-01-31
draft = true
+++


Example:
```js
  const ctr = getRequiredActionFor(statusOpgaveCtr);
  const cltr = getRequiredActionFor(statusOpgaveCltr);


  // prettier-ignore
  switch (true) {
    case ctr === ActionIconStates.ADD  && cltr === ActionIconStates.NVT:
    case ctr === ActionIconStates.ADD  && cltr === ActionIconStates.EDIT:
    case ctr === ActionIconStates.ADD  && cltr === ActionIconStates.DONE:
    case ctr === ActionIconStates.ADD  && cltr === ActionIconStates.ADD:
    case ctr === ActionIconStates.NVT  && cltr === ActionIconStates.ADD:
    case ctr === ActionIconStates.EDIT && cltr === ActionIconStates.ADD:
    case ctr === ActionIconStates.DONE && cltr === ActionIconStates.ADD:
      return ActionIconStates.ADD;


    case ctr === ActionIconStates.EDIT && cltr === ActionIconStates.NVT:
    case ctr === ActionIconStates.EDIT && cltr === ActionIconStates.DONE:
    case ctr === ActionIconStates.EDIT && cltr === ActionIconStates.EDIT:
    case ctr === ActionIconStates.NVT  && cltr === ActionIconStates.EDIT:
    case ctr === ActionIconStates.DONE && cltr === ActionIconStates.EDIT:
      return ActionIconStates.EDIT;


    case ctr === ActionIconStates.DONE && cltr === ActionIconStates.NVT:
    case ctr === ActionIconStates.DONE && cltr === ActionIconStates.DONE:
    case ctr === ActionIconStates.NVT  && cltr === ActionIconStates.DONE:
      return ActionIconStates.DONE;


    default:
      return ActionIconStates.NVT;
  }
```
