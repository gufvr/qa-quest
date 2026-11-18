import styled from "styled-components";

export const TracksLocked = styled.section`
  display: grid;
  justify-items: start;
  align-content: center;
  min-height: 60vh;

  h1 {
    margin: 14px 0 18px;
    font-size: clamp(2.6rem, 5vw, 4.6rem);
    letter-spacing: -0.055em;
  }

  p {
    max-width: 650px;
    margin: 0 0 26px;
    color: var(--muted);
  }
`;

export const TracksContent = styled.div`
  .track-details__note {
    margin: 22px 0 0;
    color: var(--muted);
    font-size: 0.77rem;
  }
`;

export const TracksIntro = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 76px;

  > div:first-child {
    max-width: 750px;
  }

  h1 {
    margin: 14px 0 18px;
    font-size: clamp(2.6rem, 5vw, 4.6rem);
    letter-spacing: -0.055em;
  }

  p {
    max-width: 650px;
    margin: 0;
    color: var(--muted);
  }

  @media (max-width: 900px) {
    align-items: start;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 54px;
  }
`;

export const TracksSummary = styled.div`
  display: grid;
  gap: 5px;
  width: 230px;
  flex: none;
  padding: 22px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;

  strong {
    color: var(--cyan);
    font-family: "Space Grotesk", sans-serif;
    font-size: 1.75rem;
  }

  span {
    color: var(--muted);
    font-size: 0.75rem;
  }

  @media (max-width: 900px) {
    width: 100%;
  }
`;

export const TracksSectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 32px;
  margin-bottom: 24px;

  h2 {
    margin-top: 9px;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
  }

  p {
    max-width: 340px;
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    align-items: start;
    flex-direction: column;
    gap: 10px;
  }
`;

export const TrackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const TrackCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  min-height: 270px;
  padding: 25px;
  color: var(--white);
  text-align: left;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 18px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:focus-visible {
    outline: 3px solid var(--cyan);
    outline-offset: 4px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.78;
  }

  &[aria-pressed="true"] {
    border-color: var(--cyan);
    background:
      linear-gradient(
        145deg,
        rgba(82, 225, 232, 0.09),
        rgba(139, 92, 246, 0.08)
      ),
      var(--card);
  }

  @media (hover: hover) and (pointer: fine) {
    &:not(:disabled):hover {
      transform: translateY(-3px);
      border-color: var(--purple);
    }
  }

  @media (max-width: 900px) {
    min-height: 215px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const TrackCardEyebrow = styled.span`
  color: var(--purple-bright);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.1em;
`;

export const TrackCardDescription = styled.span`
  margin-top: 9px;
  color: var(--muted);
  font-size: 0.84rem;
`;

export const TrackCardSequence = styled.span`
  margin-top: auto;
  padding-top: 18px;
  color: var(--cyan);
  font-size: 0.76rem;
  font-weight: 700;
`;

export const TrackCardFooter = styled.span`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin: 19px 0 11px;
  color: var(--muted);
  font-size: 0.69rem;

  span:last-child {
    color: var(--white);
  }
`;

export const TrackProgressBar = styled.span`
  display: block;
  height: 5px;
  overflow: hidden;
  background: var(--navy-700);
  border-radius: 99px;
`;

export const TrackProgressFill = styled.span`
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--purple), var(--cyan));
  border-radius: inherit;
  transition: width 0.35s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const TrackDetails = styled.section`
  scroll-margin-top: 24px;
  margin-top: 34px;
  padding: 34px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 22px;

  a {
    transition:
      color 0.18s ease,
      text-decoration-color 0.18s ease;
  }

  a:hover,
  a:focus-visible {
    color: var(--cyan-soft);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 640px) {
    padding: 22px 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
  }
`;

export const TrackDetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 28px;

  h2 {
    margin: 8px 0 10px;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
  }

  p {
    max-width: 700px;
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

export const TrackDetailsProgress = styled.div`
  display: grid;
  align-content: center;
  justify-items: center;
  min-width: 130px;
  padding: 14px;
  background: rgba(82, 225, 232, 0.06);
  border: 1px solid rgba(82, 225, 232, 0.2);
  border-radius: 14px;

  strong {
    color: var(--cyan);
    font-family: "Space Grotesk", sans-serif;
    font-size: 1.55rem;
  }

  span {
    color: var(--muted);
    font-size: 0.68rem;
  }

  @media (max-width: 640px) {
    justify-items: start;
  }
`;

export const TrackDetailsFacts = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin: 30px 0;

  p {
    display: grid;
    gap: 5px;
    margin: 0;
    padding: 16px 18px;
    background: var(--navy-900);
    border: 1px solid var(--line);
    border-radius: 12px;
    font-size: 0.82rem;
  }

  strong {
    color: var(--cyan);
  }

  span {
    color: var(--muted);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

export const TrackModules = styled.ol`
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const TrackModule = styled.li`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  background: var(--navy-900);
  border: 1px solid var(--line);
  border-radius: 12px;

  .track-module__number {
    color: var(--purple-bright);
    font-family: "Space Grotesk", sans-serif;
    font-weight: 700;
  }

  strong {
    font-size: 0.95rem;
  }

  p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 0.78rem;
  }

  .track-module__actions {
    display: grid;
    justify-items: end;
    gap: 5px;
  }

  .track-module__status {
    color: var(--muted);
    font-size: 0.7rem;
    font-weight: 800;
  }

  &.track-module--done .track-module__status {
    color: var(--cyan);
  }

  a {
    color: var(--cyan);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .track-module__copy {
    min-width: 0;
  }

  @media (max-width: 640px) {
    grid-template-columns: 32px minmax(0, 1fr);

    .track-module__actions {
      grid-column: 2;
      justify-items: start;
    }
  }
`;
