import React from 'react';
import PropTypes from 'prop-types';

const AddonCredits = ({manifest}) => (
  manifest.credits ? manifest.credits.map((author, index) => {
    const isLast = index === manifest.credits.length - 1;
    return (
      <span key={index}>
        <a
          href={author.link}
          target="_blank"
          rel="noreferrer"
        >
          {author.name}
        </a>
        {isLast ? null : ', '}
      </span>
    );
  }) : <span>unknown</span>
);

AddonCredits.propTypes = {
  manifest: PropTypes.shape({
    credits: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      link: PropTypes.string
    }))
  })
};

export default AddonCredits;