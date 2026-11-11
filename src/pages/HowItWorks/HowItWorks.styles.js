import styled from "styled-components";

export const Cards = styled.div`
  display: grid;
  gap: 16px;

  @media (min-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Card = styled.article`
  padding: 24px;
  background: var(--home-surface);
  border: 1px solid var(--home-border);
  border-radius: 18px;

  .label {
    display: block;
    margin-bottom: 12px;
  }

  h3 {
    font-size: 1.1rem;
  }

  p {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .page-back {
    margin: 12px 0 0;
    color: var(--cyan-soft);
  }
`;
