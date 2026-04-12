import React from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, IconButton } from '@material-ui/core';
import { AddShoppingCart } from '@material-ui/icons';

import useStyles from './styles';

const Product = ({ product, onAddToCart }) => {
  const classes = useStyles();

  const handleAddToCart = () => onAddToCart(product.id, 1);

  return (
    <Card className={classes.root}>
      {/* FIXED: Changed .media.source to .image?.source with a fallback */}
      <CardMedia 
        className={classes.media} 
        image={product.image?.source || product.image?.url || 'https://via.placeholder.com/150'} 
        title={product.name} 
      />
      <CardContent>
        <div className={classes.cardContent}>
          <Typography gutterBottom variant="h5" component="h2">
            {product.name}
          </Typography>
          <Typography gutterBottom variant="h5" component="h2">
            {/* FIXED: Using formatted_with_symbol to match your App.jsx mapping */}
            {product.price?.formatted_with_symbol || 'Price N/A'}
          </Typography>
        </div>
        <Typography 
          dangerouslySetInnerHTML={{ __html: product.description }} 
          variant="body2" 
          color="textSecondary" 
          component="p" 
        />
      </CardContent>
      <CardActions disableSpacing className={classes.cardActions}>
        <IconButton aria-label="Add to Cart" onClick={handleAddToCart}>
          <AddShoppingCart />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default Product;