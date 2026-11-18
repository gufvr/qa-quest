import styled from "styled-components";

export const ExplorerRoot = styled.div`
  min-width: 0;
`;

export const AccessNotice = styled.section`
  max-width: 760px;
  margin: 0 auto 28px;
  padding: 24px;
  color: var(--muted);
  background: rgba(24, 24, 27, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 17px;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);

  h2 {
    margin-top: 0;
    color: inherit;
  }

  p {
    line-height: 1.6;
  }

  html[data-theme="light"] & {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(74, 52, 123, 0.12);
  }
`;

export const ReadOnlyNotice = styled.p`
  margin: 14px 0;
  color: var(--muted);
  font-size: 0.75rem;
  text-align: left;
`;
